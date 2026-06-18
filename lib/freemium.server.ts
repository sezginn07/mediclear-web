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

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, premium_expires_at, analysis_count_monthly, analysis_reset_date, bonus_analyses')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { count: 0, limit: FREE_LIMIT, isPremium: false, hasReachedLimit: false };
  }

  // Premium only counts while not expired (matches /api/analyze enforcement).
  const expiresAt = profile.premium_expires_at;
  const isPremium =
    (profile.is_premium ?? false) && (!expiresAt || new Date(expiresAt) > new Date());

  let count = profile.analysis_count_monthly ?? 0;

  if (isPremium && profile.analysis_reset_date) {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    if (new Date(profile.analysis_reset_date) < firstOfMonth) {
      count = 0;
    }
  }

  // Free tier: lifetime limit plus referral bonuses.
  const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT + (profile.bonus_analyses ?? 0);
  return { count, limit, isPremium, hasReachedLimit: count >= limit };
}
