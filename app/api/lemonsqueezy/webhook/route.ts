import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ProfileUpdate } from '@/lib/supabase/types';

export const runtime = 'nodejs';

// Lemon Squeezy webhook payload (only the fields we read).
interface LsWebhook {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string; user_email?: string };
  };
  data?: {
    attributes?: { status?: string; user_email?: string };
  };
}

// Verify the X-Signature header: HMAC-SHA256(rawBody, secret) in hex.
function verifySignature(raw: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(signature, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get('x-signature') ?? '';
  if (!verifySignature(raw, signature, secret)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  let payload: LsWebhook;
  try {
    payload = JSON.parse(raw) as LsWebhook;
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const custom = payload.meta?.custom_data ?? {};
  const attrs = payload.data?.attributes ?? {};
  // Prefer the user id we attached at checkout; fall back to the buyer email.
  const userId = custom.user_id || null;
  const email = custom.user_email || attrs.user_email || null;

  if (!userId && !email) {
    // Nothing to map the purchase to — acknowledge so LS stops retrying.
    return NextResponse.json({ received: true, mapped: false });
  }

  const admin = createAdminClient();
  const now = new Date();
  const plus30 = (from: Date) => {
    const d = new Date(from);
    d.setDate(d.getDate() + 30);
    return d;
  };

  // Apply an update scoped to the resolved profile (by id, else by email).
  async function update(fields: ProfileUpdate): Promise<void> {
    const base = admin.from('profiles').update(fields);
    const scoped = userId ? base.eq('id', userId) : base.eq('email', email!);
    await scoped;
  }

  // Extend from the later of now or the current expiry, so an early renewal
  // never shortens the entitlement.
  async function extendedExpiry(): Promise<Date> {
    const sel = admin.from('profiles').select('premium_expires_at');
    const { data } = await (userId ? sel.eq('id', userId) : sel.eq('email', email!)).single();
    const current = data?.premium_expires_at ? new Date(data.premium_expires_at) : null;
    return plus30(current && current > now ? current : now);
  }

  switch (eventName) {
    case 'order_created':
    case 'subscription_created': {
      await update({
        is_premium: true,
        premium_expires_at: plus30(now).toISOString(),
        analysis_count_monthly: 0,
        analysis_reset_date: now.toISOString().split('T')[0],
      });
      break;
    }

    case 'subscription_updated': {
      if (attrs.status === 'active') {
        await update({
          is_premium: true,
          premium_expires_at: (await extendedExpiry()).toISOString(),
        });
      }
      break;
    }

    case 'subscription_cancelled':
    case 'subscription_expired': {
      await update({ is_premium: false, premium_expires_at: now.toISOString() });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
