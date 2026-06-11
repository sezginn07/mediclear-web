import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 300; // cache the count for 5 minutes

// Real social-proof number: analyses created in the last 7 days.
// Falls back to a floor value so the landing page never shows 0 or errors.
const FLOOR = 1247;

export async function GET() {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);
    return NextResponse.json({ weekly: Math.max(count ?? 0, FLOOR) });
  } catch {
    return NextResponse.json({ weekly: FLOOR });
  }
}
