import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Delete analyses and profile (cascades via FK, but be explicit).
  await admin.from('analyses').delete().eq('user_id', user.id);
  await admin.from('profiles').delete().eq('id', user.id);

  // Delete the auth user — this is permanent.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  // Invalidate the current session.
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
