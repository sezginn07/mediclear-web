import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Admin client — uses service role key, bypasses RLS.
// Server-only. Never import this from a client component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase admin credentials are not configured.');
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
