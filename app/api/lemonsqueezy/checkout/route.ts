import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutUrl, isConfigured } from '@/lib/lemonsqueezy';

export const runtime = 'nodejs';

// Creates a Lemon Squeezy hosted checkout for the Premium subscription.
// Success → /analyze?upgraded=true (set in lib/lemonsqueezy), cancel → LS default.
// If LS isn't configured, returns { configured: false } so the client falls back
// gracefully (same response shape the frontend already handles).
export async function POST() {
  if (!isConfigured()) {
    return NextResponse.json({ configured: false }, { status: 200 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Pass whatever identity we have. When logged in, the webhook maps the
    // purchase back via custom_data.user_id; otherwise it falls back to email.
    const url = await createCheckoutUrl(user?.email ?? '', user?.id ?? '');
    if (!url) {
      return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
    }
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
  }
}
