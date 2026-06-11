'use client';

import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/cn';

// Builds a locale-switched URL by replacing the locale segment in the current
// pathname. Uses window.location.href for navigation so it works on any host
// (localhost, LAN IP, production domain) without relying on Next.js router
// internals that may behave differently outside localhost.
function buildLocalePath(currentPath: string, currentLocale: string, targetLocale: string): string {
  // currentPath from next-intl's usePathname is the locale-stripped path (e.g. "/pricing")
  // We need to produce "/<targetLocale><currentPath>"
  return `/${targetLocale}${currentPath === '/' ? '' : currentPath}` || `/${targetLocale}`;
}

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname(); // locale-stripped, e.g. "/" or "/pricing"

  function switchLocale(target: string) {
    if (target === locale) return;
    const newPath = buildLocalePath(pathname, locale, target);
    window.location.href = newPath;
  }

  return (
    <div className="inline-flex rounded-lg border border-border bg-white p-0.5">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-colors',
            l === locale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted hover:text-foreground',
          )}
          aria-current={l === locale ? 'true' : undefined}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
