import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// IMPORTANT: do NOT override `auth.storage` here. createBrowserClient stores
// the session AND the PKCE code_verifier in cookies so the server-side OAuth
// callback (app/auth/callback/route.ts) and proxy.ts can read them. Forcing
// localStorage breaks exchangeCodeForSession on the server and splits the
// session between client and server.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    },
  );
}
