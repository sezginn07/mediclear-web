'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { AuthCard } from '@/components/auth/AuthCard';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const locale = useLocale();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError(t('passwordTooShort')); return; }
    if (password !== confirm) { setError(t('passwordMismatch')); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) { setError(authError.message); return; }
      setDone(true);
      setTimeout(() => { window.location.href = `/${locale}/analyze`; }, 2000);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthCard title={t('title')}>
        <p className="text-sm text-green-600">{t('successMessage')}</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('title')} subtitle={t('subtitle')}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            {t('newPassword')}
          </label>
          <input
            id="password" type="password" autoComplete="new-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={t('newPasswordPlaceholder')}
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-foreground">
            {t('confirmPassword')}
          </label>
          <input
            id="confirm" type="password" autoComplete="new-password" required
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder={t('confirmPasswordPlaceholder')}
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? <><Spinner />{t('submitting')}</> : t('submit')}
        </button>
      </form>
    </AuthCard>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
