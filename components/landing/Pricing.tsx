'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckIcon, SparklesIcon } from '@/components/ui/icons';

// Stripe is gated by an explicit flag set in Vercel only once the STRIPE_* vars
// are live. Until then the Premium CTA shows a disabled "Coming soon" state
// instead of triggering a checkout that returns { configured: false }.
const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_CONFIGURED === 'true';

export function Pricing() {
  const t = useTranslations('pricing');
  const ts = useTranslations('stripe');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'info' | 'error'; message: string } | null>(null);

  const freeFeatures = t.raw('free.features') as string[];
  const premiumFeatures = t.raw('premium.features') as string[];

  async function startCheckout() {
    setLoading(true);
    setAlert(null);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      if (!res.ok) {
        setAlert({ type: 'error', message: ts('checkoutFailed') });
        return;
      }
      const data = (await res.json()) as { url?: string; configured?: boolean; error?: string };
      if (data.url) {
        setAlert({ type: 'info', message: ts('redirecting') });
        window.location.href = data.url;
        return;
      }
      // Stripe keys are missing — show "coming soon" message
      setAlert({ type: 'info', message: ts('comingSoon') });
    } catch {
      setAlert({ type: 'error', message: ts('networkError') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="pricing" className="border-t border-border bg-white">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {t('title')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">{t('subtitle')}</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-primary">
            {t('anchor')}
          </p>
        </div>

        {alert && (
          <div
            className={`mx-auto mt-6 max-w-3xl rounded-xl border px-4 py-3 text-sm ${
              alert.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-blue-200 bg-blue-50 text-blue-700'
            }`}
          >
            {alert.message}
          </div>
        )}

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
          {/* Free */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Card className="flex h-full flex-col p-8">
              <h3 className="text-lg font-semibold text-foreground">
                {t('free.name')}
              </h3>
              <p className="mt-1 text-sm text-muted">{t('free.description')}</p>
              <div className="mt-4 text-4xl font-bold text-foreground">
                {t('free.price')}
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-foreground">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-status-normal" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="secondary"
                className="mt-8"
                onClick={() => router.push('/analyze')}
              >
                {t('free.cta')}
              </Button>
            </Card>
          </motion.div>

          {/* Premium */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Card
              className="relative flex h-full flex-col border-primary p-8 ring-1 ring-primary"
              style={{ boxShadow: '0 0 0 1px rgba(26,111,212,0.15), 0 8px 32px -4px rgba(26,111,212,0.25)' }}
            >
              <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md shadow-blue-600/30">
                <SparklesIcon className="h-3 w-3" />
                {t('premium.badge')}
              </span>
              <h3 className="text-lg font-semibold text-foreground">
                {t('premium.name')}
              </h3>
              <p className="mt-1 text-sm text-muted">{t('premium.description')}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  {t('premium.price')}
                </span>
                <span className="text-sm text-muted">{t('perMonth')}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-foreground">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-status-normal" />
                    {f}
                  </li>
                ))}
              </ul>
              {STRIPE_ENABLED ? (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-8">
                  <Button className="w-full" onClick={startCheckout} disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        {ts('preparing')}
                      </span>
                    ) : (
                      t('premium.cta')
                    )}
                  </Button>
                </motion.div>
              ) : (
                /* Stripe not configured yet — disabled CTA, no dead-end checkout. */
                <Button className="mt-8 w-full" disabled title={t('premium.comingSoon')}>
                  {t('premium.comingSoon')}
                </Button>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
