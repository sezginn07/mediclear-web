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
import { FREE_LIMIT, PREMIUM_LIMIT } from '@/lib/freemium';
import { getFreemiumStatus } from '@/lib/freemium.server';
import type { Profile, ProfileUpdate, AnalysisInsert } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

function fail(code: string, status: number) {
  return NextResponse.json({ code }, { status });
}

export async function POST(request: Request) {
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

  if (user) {
    // Require email confirmation for logged-in users.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileRaw } = await (supabase as any)
      .from('profiles')
      .select('email_confirmed, is_premium, analysis_count_monthly, analysis_reset_date')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'email_confirmed' | 'is_premium' | 'analysis_count_monthly' | 'analysis_reset_date'> | null; error: unknown };
    const profile = profileRaw;

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

    // Check limits from database.
    const status = await getFreemiumStatus(user.id);
    if (status.hasReachedLimit) {
      return fail('limitReached', 403);
    }
  }
  // Guest users: limit enforcement is client-side (localStorage).

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

  // ── Persist result + increment count for logged-in users ──────────────
  if (user) {
    const today = new Date().toISOString().split('T')[0];

    // Fetch current state for monthly reset logic.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile2 } = await (supabase as any)
      .from('profiles')
      .select('is_premium, analysis_count_monthly, analysis_reset_date')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'is_premium' | 'analysis_count_monthly' | 'analysis_reset_date'> | null; error: unknown };

    const isPremiumUser = profile2?.is_premium ?? false;
    const resetDateStr: string = profile2?.analysis_reset_date ?? today;
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const needsReset = isPremiumUser && new Date(resetDateStr) < firstOfMonth;
    const currentCount = needsReset ? 0 : (profile2?.analysis_count_monthly ?? 0);
    const newCount = currentCount + 1;

    // Insert analysis record.
    const insertRow: AnalysisInsert = {
      user_id: user.id,
      report_name: file.name,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('analyses').insert(insertRow);

    // Increment count (with optional monthly reset).
    const updatePayload: ProfileUpdate = { analysis_count_monthly: newCount };
    if (needsReset) {
      updatePayload.analysis_reset_date = today;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('profiles').update(updatePayload).eq('id', user.id);
  }

  return NextResponse.json(result);
}
