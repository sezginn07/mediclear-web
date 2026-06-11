import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    <footer className="border-t border-border bg-white no-print">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Medi<span className="text-primary">Clear</span>
            </span>
            <p className="mt-3 max-w-xs text-sm text-muted">{t('tagline')}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {t('product')}
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a href="/#features" className="hover:text-foreground">
                  {nav('features')}
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-foreground">
                  {nav('pricing')}
                </a>
              </li>
              <li>
                <Link href="/analyze" className="hover:text-foreground">
                  {nav('startAnalysis')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {t('legal')}
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a
                  href="https://sezginn07.github.io/mediclear-privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  {t('privacy')}
                </a>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  {t('terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs leading-relaxed text-muted">{t('disclaimer')}</p>
          <p className="mt-3 text-xs text-muted">
            © 2026 MediClear. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
