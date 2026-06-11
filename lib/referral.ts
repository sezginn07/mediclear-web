// Referral loop — client-side half.
//
// Flow:
//  1. Someone shares their result with a link carrying ?ref=<their id>.
//  2. The visitor lands; captureReferral() stores the ref in localStorage.
//  3. When the visitor registers, the stored ref is sent to /api/referral,
//     which credits the referrer (referral_count + bonus_analyses in profiles).
//  4. Guests who share also get a local share-id so their links are traceable
//     once they sign up.

const PENDING_REF_KEY = 'mediclear_pending_ref';
const SHARE_ID_KEY = 'mediclear_share_id';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// Store an incoming ?ref= so it survives until signup. Refuses self-shaped junk.
export function captureReferral(ref: string | null): void {
  if (!isBrowser() || !ref) return;
  // Accept UUIDs (logged-in referrers) or our guest share ids.
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(ref)) return;
  window.localStorage.setItem(PENDING_REF_KEY, ref);
}

export function getPendingReferral(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(PENDING_REF_KEY);
}

export function clearPendingReferral(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PENDING_REF_KEY);
}

// Stable share id for guests (so a share link exists before signup).
export function getShareId(): string {
  if (!isBrowser()) return 'guest';
  let id = window.localStorage.getItem(SHARE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SHARE_ID_KEY, id);
  }
  return id;
}
