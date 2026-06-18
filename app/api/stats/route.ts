import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 300; // cache the count for 5 minutes

// Honest social proof: the real, all-time number of analyses. No floor — the
// client hides the counter entirely below a threshold (see components/landing/
// Hero.tsx MIN_SOCIAL_PROOF) so we never display a fabricated or embarrassing
// number. Returns 0 on any failure.
export async function GET() {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from('analyses')
      .select('id', { count: 'exact', head: true });
    return NextResponse.json({ total: count ?? 0 });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}
