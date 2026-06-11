// Freemium gating — web port of the mobile app's useAnalysisCount hook.
//
// getFreemiumStatus(userId) reads from the database for logged-in users.
// All other functions are client-side localStorage (guest mode).
//
// Free users get 2 lifetime analyses. Premium users (Stripe subscription) get
// 10 per calendar month, with a monthly reset. All client-side via localStorage;
// the mobile app used the same approach (FREE is a lifetime counter, premium
// resets monthly). This is intentionally spoofable — see lib/stripe.ts.

const COUNT_KEY = 'mediclear_web_analysis_count';
const PREMIUM_KEY = 'mediclear_web_premium';
const PERIOD_KEY = 'mediclear_web_period'; // 'YYYY-MM' for premium monthly reset
const BONUS_KEY = 'mediclear_web_bonus'; // extra analyses earned via referrals

export const FREE_LIMIT = 2;
export const PREMIUM_LIMIT = 10;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function isPremium(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(PREMIUM_KEY) === 'true';
}

// Premium status is set after a successful Stripe checkout (success redirect
// carries ?upgraded=true). Spoofable by design — real entitlement enforcement
// would live server-side.
export function setPremium(value: boolean): void {
  if (!isBrowser()) return;
  if (value) {
    window.localStorage.setItem(PREMIUM_KEY, 'true');
    window.localStorage.setItem(PERIOD_KEY, currentPeriod());
    window.localStorage.setItem(COUNT_KEY, '0');
  } else {
    window.localStorage.removeItem(PREMIUM_KEY);
  }
}

// Reads the count, applying a monthly reset for premium users.
export function getCount(): number {
  if (!isBrowser()) return 0;

  if (isPremium()) {
    const storedPeriod = window.localStorage.getItem(PERIOD_KEY);
    if (storedPeriod !== currentPeriod()) {
      window.localStorage.setItem(PERIOD_KEY, currentPeriod());
      window.localStorage.setItem(COUNT_KEY, '0');
      return 0;
    }
  }

  const raw = window.localStorage.getItem(COUNT_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// Extra analyses earned through referrals (guest-mode, localStorage).
export function getBonus(): number {
  if (!isBrowser()) return 0;
  const n = parseInt(window.localStorage.getItem(BONUS_KEY) ?? '0', 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function addBonus(n: number): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(BONUS_KEY, String(getBonus() + n));
}

export function getLimit(): number {
  return isPremium() ? PREMIUM_LIMIT : FREE_LIMIT + getBonus();
}

export function getRemaining(): number {
  return Math.max(0, getLimit() - getCount());
}

// True when the user still has analyses left.
export function canAnalyze(): boolean {
  return getRemaining() > 0;
}

// Call AFTER a successful analysis to consume one credit. Returns the new count.
export function incrementCount(): number {
  if (!isBrowser()) return 0;
  const next = getCount() + 1;
  window.localStorage.setItem(COUNT_KEY, String(next));
  return next;
}

export interface UsageSnapshot {
  count: number;
  limit: number;
  remaining: number;
  premium: boolean;
  canAnalyze: boolean;
}

export function getUsage(): UsageSnapshot {
  const count = getCount();
  const limit = getLimit();
  const premium = isPremium();
  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
    premium,
    canAnalyze: count < limit,
  };
}

