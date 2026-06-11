import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getBaseUrl } from '@/lib/baseUrl';

// Resolve the user's locale: explicit `next` param wins, then the NEXT_LOCALE
// cookie set by next-intl, then Accept-Language, then Turkish (default market).
function detectLocale(request: NextRequest, cookieLocale?: string): 'tr' | 'en' {
  if (cookieLocale === 'en' || cookieLocale === 'tr') return cookieLocale;
  const accept = request.headers.get('accept-language') ?? '';
  return accept.toLowerCase().startsWith('en') ? 'en' : 'tr';
}

// Only allow same-origin relative paths — prevents open redirects via ?next=.
function sanitizeNext(next: string | null): string | null {
  if (!next) return null;
  const decoded = decodeURIComponent(next);
  if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.includes('\\')) {
    return decoded;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const baseUrl = getBaseUrl();

  const cookieStore = await cookies();
  const locale = detectLocale(request, cookieStore.get('NEXT_LOCALE')?.value);
  const next = sanitizeNext(searchParams.get('next')) ?? `/${locale}/analyze`;

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/${locale}/auth/login?error=auth_callback_failed`);
}
