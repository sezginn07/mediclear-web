import { NextResponse } from 'next/server';
import {
  getStripe,
  getPriceId,
  getBaseUrl,
  isStripeConfigured,
} from '@/lib/stripe';

export const runtime = 'nodejs';

// Creates a hosted Checkout Session for the Premium subscription.
// Success → /analyze?upgraded=true, cancel → /pricing.
// If Stripe isn't configured, returns { configured: false } so the client can
// fall back gracefully (the gate is spoofable by design — see lib/stripe.ts).
export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ configured: false }, { status: 200 });
  }

  try {
    const stripe = getStripe();
    const base = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: getPriceId(), quantity: 1 }],
      success_url: `${base}/analyze?upgraded=true`,
      cancel_url: `${base}/pricing`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
  }
}
