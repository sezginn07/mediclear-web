import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Protected routes — redirect to login when there is no active session.
const PROTECTED_PREFIXES = ['/account'];

function isProtected(pathname: string): boolean {
  // Strip locale prefix (/tr/account → /account)
  const stripped = pathname.replace(/^\/(tr|en)/, '');
  return PROTECTED_PREFIXES.some((p) => stripped === p || stripped.startsWith(p + '/'));
}

export async function proxy(request: NextRequest) {
  // 1. Supabase: refresh the session cookie so it never expires mid-visit.
  //    We must create a mutable response first and pipe cookies through it.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() refreshes the session. Do NOT use getSession() — it is
  // unauthenticated and should never be trusted on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 2. Protected-route guard.
  if (isProtected(pathname) && !user) {
    // Locale is the first segment of the pathname (e.g. /tr/account → 'tr').
    const locale = pathname.split('/')[1] === 'en' ? 'en' : 'tr';
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    // Encode the full pathname so the login page can redirect back after auth.
    loginUrl.searchParams.set('returnTo', encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // 3. next-intl: handle locale detection and prefix routing.
  const intlResponse = intlMiddleware(request);

  // Merge any cookies Supabase wrote onto the intl response.
  response.cookies.getAll().forEach(({ name, value }) => {
    intlResponse.cookies.set(name, value);
  });

  return intlResponse;
}

export const config = {
  // auth/callback is excluded: next-intl would otherwise redirect the
  // unprefixed /auth/callback?code=... to /tr/auth/callback before the route
  // handler can exchange the OAuth code for a session.
  matcher: '/((?!api|trpc|_next|_vercel|auth/callback|.*\\..*).*)',
};
