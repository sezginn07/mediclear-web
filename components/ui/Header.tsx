import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageToggle } from './LanguageToggle';
import { Button } from './Button';
import { createClient } from '@/lib/supabase/server';
import { UserMenu } from './UserMenu';

export async function Header() {
  const t = useTranslations('nav');

  let user = null;
  let isPremium = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileRaw } = await (supabase as any)
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single() as { data: { is_premium: boolean } | null; error: unknown };
      isPremium = profileRaw?.is_premium ?? false;
    }
  } catch {
    // During static prerendering cookies are unavailable — render unauthenticated state.
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur no-print">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-foreground">
            Medi<span className="text-primary">Clear</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
          <a href="/#features" className="hover:text-foreground">{t('features')}</a>
          <a href="/#how-it-works" className="hover:text-foreground">{t('howItWorks')}</a>
          <a href="/#pricing" className="hover:text-foreground">{t('pricing')}</a>
          <a href="/#faq" className="hover:text-foreground">{t('faq')}</a>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          {user ? (
            <UserMenu
              email={user.email ?? ''}
              isPremium={isPremium}
            />
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="secondary" size="sm">{t('signIn')}</Button>
              </Link>
              <Link href="/analyze">
                <Button size="sm">{t('getStarted')}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
