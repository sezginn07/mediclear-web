import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  ACCEPTED_MIME_TYPES,
  FILE_SIZE_MAX_BYTES,
  CATEGORY_IDS,
  type AnthropicMediaType,
  type CategoryId,
  type Lang,
} from '@/lib/types';
import { analyzeReport, AnalyzeReportError } from '@/lib/analysis';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FREE_LIMIT, PREMIUM_LIMIT } from '@/lib/freemium';
import { checkRateLimit, getClientIp, pruneExpired } from '@/lib/rateLimit';
import type { AnalysisInsert } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

function fail(code: string, status: number) {
  return NextResponse.json({ code }, { status });
}

// Strip control characters and cap length before the name touches the DB or UI.
function sanitizeFileName(name: string): string {
  // eslint-disable-next-line no-control-regex
  return name.replace(/[\x00-\x1f<>]/g, '').slice(0, 200) || 'report';
}

// DB-backed rate limit (atomic, global across serverless instances). Falls
// back to the in-memory limiter when the service-role key isn't configured,
// so local dev without secrets still has *some* protection.
async function isRateLimited(request: Request): Promise<boolean> {
  const ip = getClientIp(request);
  try {
    const admin = createAdminClient();
    const ipHash = createHash('sha256').update(ip).digest('hex');
    const { data: allowed, error } = await admin.rpc('check_rate_limit', {
      p_ip_hash: ipHash,
      p_max: 10,
      p_window_seconds: 3600,
    });
    if (error) throw error;
    return allowed !== true;
  } catch {
    pruneExpired();
    return !checkRateLimit(ip).allowed;
  }
}

export async function POST(request: Request) {
  // ── Rate limit: max 10 analyses per IP per hour (DB-backed) ───────────
  if (await isRateLimited(request)) {
    return NextResponse.json(
      { code: 'rate_limit' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('badType', 400);
  }

  const file = form.get('file');
  const category = String(form.get('category') ?? '') as CategoryId;
  const lang = (String(form.get('lang') ?? 'tr') === 'en' ? 'en' : 'tr') as Lang;

  if (!(file instanceof File)) return fail('noFile', 400);
  if (!CATEGORY_IDS.includes(category)) return fail('noCategory', 400);
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) return fail('badType', 400);
  if (file.size > FILE_SIZE_MAX_BYTES) return fail('tooLarge', 400);

  // ── Auth check (optional — guests can still analyze) ──────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let creditConsumed = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'email_confirmed, is_premium, premium_expires_at, analysis_count_monthly, analysis_reset_date, bonus_analyses',
      )
      .eq('id', user.id)
      .single();

    // Email confirmed if any of: our DB flag, Supabase native field, or OAuth provider.
    const isEmailConfirmed =
      profile?.email_confirmed === true ||
      user.email_confirmed_at != null ||
      user.app_metadata?.provider === 'google' ||
      user.app_metadata?.provider === 'github' ||
      user.app_metadata?.provider === 'apple';

    if (!isEmailConfirmed) {
      return NextResponse.json(
        { code: lang === 'tr' ? 'email_not_confirmed_tr' : 'email_not_confirmed_en' },
        { status: 403 },
      );
    }

    // Server-side premium: the DB flag counts only while not expired.
    // (Never trust the client's localStorage premium flag.)
    const expiresAt = profile?.premium_expires_at;
    const isPremium =
      (profile?.is_premium ?? false) &&
      (!expiresAt || new Date(expiresAt) > new Date());

    // Monthly reset for premium users, applied before consuming a credit.
    if (isPremium && profile?.analysis_reset_date) {
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);
      if (new Date(profile.analysis_reset_date) < firstOfMonth) {
        await supabase
          .from('profiles')
          .update({
            analysis_count_monthly: 0,
            analysis_reset_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', user.id);
      }
    }

    // Effective limit: premium 10/month; free 2 lifetime + referral bonuses.
    const effectiveLimit = isPremium
      ? PREMIUM_LIMIT
      : FREE_LIMIT + (profile?.bonus_analyses ?? 0);

    // Atomic consume-one-credit. Returns false when the user is at the limit,
    // so two parallel requests can never both pass the check.
    const { data: allowed, error: rpcError } = await supabase.rpc(
      'increment_analysis_count',
      { p_user_id: user.id, p_limit: effectiveLimit },
    );
    if (rpcError) return fail('server', 500);
    if (allowed !== true) return fail('limitReached', 403);
    creditConsumed = true;
  }
  // Guest users: no account to meter — the IP rate limit above is the gate.

  const base64Data = Buffer.from(await file.arrayBuffer()).toString('base64');

  let result;
  try {
    result = await analyzeReport({
      base64Data,
      mediaType: file.type as AnthropicMediaType,
      category,
      lang,
    });
  } catch (err) {
    // The credit was consumed up front; refund it since no analysis happened.
    // Uses the admin client — the refund function is service-role only.
    if (user && creditConsumed) {
      try {
        await createAdminClient().rpc('decrement_analysis_count', { p_user_id: user.id });
      } catch {
        // Refund is best-effort; a lost credit is annoying but not unsafe.
      }
    }
    if (err instanceof AnalyzeReportError) {
      const status =
        err.code === 'auth' ? 502
        : err.code === 'rate_limit' ? 429
        : err.code === 'config' ? 503
        : 502;
      return fail(err.code, status);
    }
    return fail('generic', 500);
  }

  // ── Persist result for logged-in users ─────────────────────────────────
  if (user) {
    const insertRow: AnalysisInsert = {
      user_id: user.id,
      report_name: sanitizeFileName(file.name),
      category,
      language: lang,
      status: result.status,
      summary: result.summary,
      key_findings: result.keyFindings,
      doctor_questions: result.doctorQuestions,
      do_list: result.doList,
      dont_list: result.dontList,
      urgency: result.urgency ?? null,
      disclaimer: result.disclaimer ?? null,
    };
    await supabase.from('analyses').insert(insertRow);
  }

  return NextResponse.json(result);
}
