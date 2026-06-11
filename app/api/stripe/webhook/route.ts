import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email ?? session.customer_email;
      const customerId = typeof session.customer === 'string' ? session.customer : null;

      if (customerEmail) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await admin
          .from('profiles')
          .update({
            is_premium: true,
            premium_expires_at: expiresAt.toISOString(),
            stripe_customer_id: customerId ?? undefined,
            analysis_count_monthly: 0,
            analysis_reset_date: new Date().toISOString().split('T')[0],
          })
          .eq('email', customerEmail);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : null;
      if (customerId) {
        await admin
          .from('profiles')
          .update({ is_premium: false, premium_expires_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      if (sub.status === 'canceled' || sub.status === 'unpaid') {
        const customerId = typeof sub.customer === 'string' ? sub.customer : null;
        if (customerId) {
          await admin
            .from('profiles')
            .update({ is_premium: false, premium_expires_at: new Date().toISOString() })
            .eq('stripe_customer_id', customerId);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      console.warn('[Stripe] Payment failed for customer:', customerId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
