import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/landing/Footer';
import { AccountClient } from '@/components/account/AccountClient';
import type { Analysis, Profile } from '@/lib/supabase/types';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const [profileResult, analysesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const t = await getTranslations('account');

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <div className="mt-8">
          <AccountClient
            profile={profileResult.data as Profile | null}
            analyses={(analysesResult.data ?? []) as Analysis[]}
            userEmail={user.email ?? ''}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
