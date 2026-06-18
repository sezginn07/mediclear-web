// Lemon Squeezy server client + checkout helper (the app's payments provider).
//
// Premium entitlement is enforced server-side by the webhook
// (app/api/lemonsqueezy/webhook) which flips profiles.is_premium /
// premium_expires_at. The client localStorage flag in lib/freemium.ts is only
// an optimistic UI hint — the analyze route trusts the DB, not the browser.

import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { getBaseUrl } from './baseUrl';

export const PREMIUM_PRICE_USD = 5.49;

let initialized = false;

// Configure the SDK once, lazily, so the app still boots when the LS env vars
// are absent — only the /api/lemonsqueezy/* routes need them.
function ensureSetup(): void {
  if (initialized) return;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error('LEMONSQUEEZY_API_KEY is not configured.');
  lemonSqueezySetup({ apiKey });
  initialized = true;
}

export function isConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_VARIANT_ID,
  );
}

// Creates a hosted checkout for the Premium subscription variant and returns
// its URL. custom_data travels through to the webhook as meta.custom_data so we
// can map the purchase back to the MediClear user. Returns null on failure.
export async function createCheckoutUrl(
  userEmail: string,
  userId: string,
): Promise<string | null> {
  ensureSetup();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  if (!storeId || !variantId) {
    throw new Error('LEMONSQUEEZY_STORE_ID / LEMONSQUEEZY_VARIANT_ID are not configured.');
  }

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: userEmail || undefined,
      custom: { user_id: userId, user_email: userEmail },
    },
    productOptions: {
      redirectUrl: `${getBaseUrl()}/analyze?upgraded=true`,
    },
  });

  if (error) return null;
  return data?.data.attributes.url ?? null;
}
