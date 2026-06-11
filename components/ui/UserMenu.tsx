'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  email: string;
  isPremium: boolean;
}

export function UserMenu({ email, isPremium }: Props) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.href = `/${locale}`;
  }

  const avatarLetter = (email?.[0] ?? '?').toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {avatarLetter}
        </div>
        {isPremium && (
          <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 sm:inline">
            Premium
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-white py-1 shadow-lg">
          <p className="truncate px-4 py-2 text-xs text-muted">{email}</p>
          <div className="my-1 border-t border-border" />
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-foreground hover:bg-slate-50"
          >
            {t('myAccount')}
          </Link>
          <div className="my-1 border-t border-border" />
          <button
            onClick={handleSignOut}
            className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-slate-50"
          >
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
