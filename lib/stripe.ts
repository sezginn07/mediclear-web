// Stripe server client + config.
//
// SPOOFABLE BY DESIGN: premium entitlement is stored in the browser
// (lib/freemium.ts). The Stripe integration is wired end-to-end — real
// Checkout, real webhook — but the gate it unlocks is client-side, so a
// determined user can flip it without paying. Hardening would mean a real
// user/session backend keyed off the webhook. Out of scope for this build.

import Stripe from 'stripe';

export const PREMIUM_PRICE_USD = 4.99;

let cached: Stripe | null = null;

// Lazily construct the Stripe client so the app still boots (landing, analyze,
// results) when Stripe env vars are absent — only the /api/stripe/* routes need it.
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }
  cached = new Stripe(key);
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

export function getPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID;
  if (!id) throw new Error('STRIPE_PRICE_ID is not configured.');
  return id;
}

// Absolute base URL for building Checkout success/cancel redirects.
export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}
