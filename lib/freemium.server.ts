import { FREE_LIMIT, PREMIUM_LIMIT } from './freemium';
import { createClient } from './supabase/server';

export interface FreemiumStatus {
  count: number;
  limit: number;
  isPremium: boolean;
  hasReachedLimit: boolean;
}

export async function getFreemiumStatus(userId?: string): Promise<FreemiumStatus> {
  if (!userId) {
    return { count: 0, limit: FREE_LIMIT, isPremium: false, hasReachedLimit: false };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('is_premium, analysis_count_monthly, analysis_reset_date')
    .eq('id', userId)
    .single() as { data: { is_premium: boolean; analysis_count_monthly: number; analysis_reset_date: string } | null; error: unknown };

  if (!profile) {
    return { count: 0, limit: FREE_LIMIT, isPremium: false, hasReachedLimit: false };
  }

  const premiumVal = profile.is_premium ?? false;
  const resetDateStr: string = profile.analysis_reset_date ?? '';
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  let count = profile.analysis_count_monthly ?? 0;

  if (premiumVal && resetDateStr) {
    if (new Date(resetDateStr) < firstOfMonth) {
      count = 0;
    }
  }

  const limit = premiumVal ? PREMIUM_LIMIT : FREE_LIMIT;
  return { count, limit, isPremium: premiumVal, hasReachedLimit: count >= limit };
}
