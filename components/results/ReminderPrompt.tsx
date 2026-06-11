'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

// Re-engagement loop: offer a one-month re-analysis reminder after results.
// Logged-in users get one-click; guests type their email.
export function ReminderPrompt({ category }: { category?: string }) {
  const t = useTranslations('results.reminder');
  const [email, setEmail] = useState('');
  const [needsEmail, setNeedsEmail] = useState(true);
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await createClient().auth.getUser();
      if (!cancelled && data.user?.email) setNeedsEmail(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function setReminder() {
    setState('saving');
    const res = await fetch('/api/reminder', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, category }),
    }).catch(() => null);
    setState(res?.ok ? 'done' : 'error');
  }

  if (state === 'done') {
    return (
      <p role="status" className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground no-print">
        ✓ {t('done')}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 no-print">
      <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
      <p className="mt-1 text-xs text-muted">{t('subtitle')}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {needsEmail && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            aria-label={t('emailPlaceholder')}
            className="h-10 flex-1 rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        )}
        <button
          type="button"
          onClick={setReminder}
          disabled={state === 'saving' || (needsEmail && !email)}
          className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {t('cta')}
        </button>
      </div>
      {state === 'error' && (
        <p role="alert" className="mt-2 text-xs text-status-urgent">{t('error')}</p>
      )}
    </div>
  );
}
