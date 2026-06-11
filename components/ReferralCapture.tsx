'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { captureReferral, clearPendingReferral, getPendingReferral } from '@/lib/referral';
import { createClient } from '@/lib/supabase/client';

// Invisible. Two jobs, on every page:
//  1. Capture an incoming ?ref= into localStorage so it survives until signup.
//  2. Once the visitor is authenticated, redeem the stored ref via
//     /api/referral (credits the referrer), then clear it.
export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureReferral(searchParams.get('ref'));

    const pending = getPendingReferral();
    if (!pending) return;

    let cancelled = false;
    (async () => {
      const { data } = await createClient().auth.getUser();
      if (cancelled || !data.user) return;
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ref: pending }),
      }).catch(() => null);
      if (res?.ok || res?.status === 400 || res?.status === 404) {
        // Redeemed (or permanently unredeemable) — stop retrying.
        clearPendingReferral();
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams]);

  return null;
}
