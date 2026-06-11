'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AuthCard } from '@/components/auth/AuthCard';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

function passwordStrength(pw: string): 'weak' | 'medium' | 'strong' {
  if (pw.length < 8) return 'weak';
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const score = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (score >= 2) return 'strong';
  if (score === 1) return 'medium';
  return 'weak';
}

export default function RegisterPage() {
  const t = useTranslations('auth.register');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [kvkk, setKvkk] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = password ? passwordStrength(password) : null;
  const strengthColor = { weak: 'bg-red-400', medium: 'bg-yellow-400', strong: 'bg-green-500' };
  const strengthWidth = { weak: 'w-1/3', medium: 'w-2/3', strong: 'w-full' };
  const strengthLabel = { weak: t('strengthWeak'), medium: t('strengthMedium'), strong: t('strengthStrong') };

  const canSubmit = terms && kvkk && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError(t('passwordTooShort')); return; }
    if (password !== confirm) { setError(t('passwordMismatch')); return; }
    if (!terms) { setError(t('termsConsentRequired')); return; }
    if (!kvkk) { setError(t('kvkkConsentRequired')); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: { kvkk_consent: true },
        },
      });
      if (authError) { setError(authError.message); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthCard title={t('successTitle')}>
        <p className="text-sm text-muted">{t('successMessage')}</p>
        <Link href="/auth/login" className="mt-4 block text-center text-sm font-medium text-primary hover:underline">
          {t('signIn')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('title')} subtitle={t('subtitle')}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            {t('email')}
          </label>
          <input
            id="email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            {t('password')}
          </label>
          <input
            id="password" type="password" autoComplete="new-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={t('passwordPlaceholder')}
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {strength && (
            <div className="mt-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div className={`h-full rounded-full transition-all ${strengthColor[strength]} ${strengthWidth[strength]}`} />
              </div>
              <p className={`mt-0.5 text-xs ${strength === 'weak' ? 'text-red-500' : strength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                {strengthLabel[strength]}
              </p>
            </div>
          )}
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

        {/* Terms of Service */}
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span>
            {t.rich('termsConsent', {
              terms: (chunks) => (
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>

        {/* KVKK consent */}
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input
            type="checkbox"
            checked={kvkk}
            onChange={(e) => setKvkk(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span>
            {t.rich('kvkkConsent', {
              privacy: (chunks) => (
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit" disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? <><Spinner />{t('submitting')}</> : t('submit')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t('alreadyHaveAccount')}{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">{t('signIn')}</Link>
      </p>
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
