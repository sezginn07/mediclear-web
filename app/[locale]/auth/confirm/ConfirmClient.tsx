'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

export function ConfirmClient() {
  const t = useTranslations('auth.confirm');
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!tokenHash || type !== 'email') {
      setStatus('error');
      return;
    }

    createClient().auth
      .verifyOtp({ token_hash: tokenHash, type: 'email' })
      .then(({ error }) => {
        if (error) {
          setStatus('error');
          return;
        }
        setStatus('success');
        setTimeout(() => {
          window.location.href = `/${locale}/analyze`;
        }, 2000);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthCard title="MediClear">
      {status === 'verifying' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm text-muted">{t('verifying')}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="text-4xl">✅</span>
          <p className="text-sm font-medium text-green-600">{t('success')}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col gap-3 py-2 text-center">
          <p className="text-sm text-red-600">{t('error')}</p>
          <Link href="/auth/login" className="text-sm font-medium text-primary hover:underline">
            {t('backToLogin')}
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
