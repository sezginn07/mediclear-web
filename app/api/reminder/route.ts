import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Stores a "re-analyze this report in a month" reminder.
// TODO: actual email delivery — needs an email service (Resend/Postmark) plus
// a daily cron selecting reminders WHERE remind_at <= today AND sent = false.
// The data model (public.reminders) is ready; see lib/supabase/schema.sql.
export async function POST(request: Request) {
  let email = '';
  let category: string | null = null;
  try {
    const body = (await request.json()) as { email?: string; category?: string };
    email = String(body.email ?? '').trim().toLowerCase();
    category = body.category ? String(body.category).slice(0, 40) : null;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in users default to their account email.
  if (user?.email) email = email || user.email.toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, reason: 'invalid_email' }, { status: 400 });
  }

  const remindAt = new Date();
  remindAt.setMonth(remindAt.getMonth() + 1);

  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from('reminders').insert({
      user_id: user?.id ?? null,
      email,
      category,
      remind_at: remindAt.toISOString().split('T')[0],
    });
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 503 });
  }
}
