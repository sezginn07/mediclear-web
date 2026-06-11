import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Called once after signup when the new user carried a ?ref= link.
// Credits the referrer: +1 referral_count, +1 bonus_analyses.
// Requires the caller to be authenticated so refs can't be farmed anonymously.
export async function POST(request: Request) {
  let ref: string;
  try {
    const body = (await request.json()) as { ref?: string };
    ref = String(body.ref ?? '');
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (user.id === ref) return NextResponse.json({ ok: false }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // Service role key not configured — referral crediting silently disabled.
    return NextResponse.json({ ok: false, reason: 'not_configured' });
  }

  // Only credit once per referred user.
  const { data: me } = await admin
    .from('profiles')
    .select('referred_by')
    .eq('id', user.id)
    .single<{ referred_by: string | null }>();
  if (me?.referred_by) return NextResponse.json({ ok: true, already: true });

  const { data: referrer } = await admin
    .from('profiles')
    .select('referral_count, bonus_analyses')
    .eq('id', ref)
    .single<{ referral_count: number; bonus_analyses: number }>();
  if (!referrer) return NextResponse.json({ ok: false }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('profiles').update({ referred_by: ref }).eq('id', user.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('profiles')
    .update({
      referral_count: (referrer.referral_count ?? 0) + 1,
      bonus_analyses: (referrer.bonus_analyses ?? 0) + 1,
    })
    .eq('id', ref);

  return NextResponse.json({ ok: true });
}
