'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

const ATTEMPTS_KEY = 'mediclear_login_attempts';
const LOCKOUT_KEY = 'mediclear_login_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export function LoginClient() {
  const t = useTranslations('auth.login');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? searchParams.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Rate limiting
  const [lockedOut, setLockedOut] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const lockoutUntil = Number(localStorage.getItem(LOCKOUT_KEY) ?? 0);
    const remaining = lockoutUntil - Date.now();
    if (remaining > 0) {
      setLockedOut(true);
      setCountdown(Math.ceil(remaining / 1000));
      startCountdown();
    } else if (lockoutUntil > 0) {
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCountdown() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const lockoutUntil = Number(localStorage.getItem(LOCKOUT_KEY) ?? 0);
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        localStorage.removeItem(ATTEMPTS_KEY);
        localStorage.removeItem(LOCKOUT_KEY);
        setLockedOut(false);
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  }

  function recordFailedAttempt() {
    const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) ?? 0) + 1;
    localStorage.setItem(ATTEMPTS_KEY, String(attempts));
    if (attempts >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_MS;
      localStorage.setItem(LOCKOUT_KEY, String(lockoutUntil));
      setLockedOut(true);
      setCountdown(Math.ceil(LOCKOUT_MS / 1000));
      startCountdown();
    }
  }

  function clearRateLimitState() {
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  }

  function safeRedirect(): string {
    if (returnTo && returnTo.startsWith('/') && !returnTo.includes('//')) {
      return decodeURIComponent(returnTo);
    }
    return `/${locale}/analyze`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lockedOut) return;
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          setError(t('emailNotConfirmed'));
        } else {
          setError(t('invalidCredentials'));
          recordFailedAttempt();
        }
        return;
      }
      clearRateLimitState();
      window.location.href = safeRedirect();
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const lockoutMessage = locale === 'tr'
    ? `Çok fazla hatalı giriş denemesi. ${countdown} saniye bekleyin.`
    : `Too many failed attempts. Wait ${countdown} seconds.`;

  return (
    <AuthCard title={t('title')} subtitle={t('subtitle')}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              {t('password')}
            </label>
            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('passwordPlaceholder')}
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {lockedOut && (
          <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {lockoutMessage}
          </p>
        )}

        {!lockedOut && error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || lockedOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? (
            <><Spinner />{t('submitting')}</>
          ) : lockedOut ? (
            String(countdown)
          ) : (
            t('submit')
          )}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted">{t('orContinueWith')}</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 disabled:opacity-60"
      >
        {googleLoading ? <Spinner /> : <GoogleIcon />}
        {t('continueWithGoogle')}
      </button>

      <p className="mt-6 text-center text-sm text-muted">
        {t('noAccount')}{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          {t('signUp')}
        </Link>
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

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
