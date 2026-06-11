'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';

export function Hero() {
  const t = useTranslations('hero');

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #E8F2FC 0%, #f8fafd 100%)' }}
    >
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-primary"
        >
          {t('badge')}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
        >
          {t('title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted"
        >
          {t('subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/analyze">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg">{t('cta')}</Button>
            </motion.div>
          </Link>
          <a href="#how-it-works">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" variant="secondary">
                {t('ctaSecondary')}
              </Button>
            </motion.div>
          </a>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-8 text-xs text-muted"
        >
          {t('disclaimer')}
        </motion.p>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 flex items-center justify-center gap-2 text-sm text-muted"
        >
          <span className="text-status-normal text-base">✓</span>
          <TrustCounter target={10000} suffix={t('trustSuffix')} />
        </motion.div>
      </div>
    </section>
  );
}

function TrustCounter({ target, suffix }: { target: number; suffix: string }) {
  return (
    <span>
      <strong className="font-semibold text-foreground">
        {target.toLocaleString()}+
      </strong>{' '}
      {suffix}
    </span>
  );
}
