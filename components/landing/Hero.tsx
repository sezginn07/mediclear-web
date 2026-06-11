'use client';

import { useEffect, useRef, useState } from 'react';
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

        {/* Trust chips — security signals within the first viewport
            (pattern: Ada Health's ISO badges next to the hero) */}
        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          {(t.raw('trustChips') as string[]).map((chip) => (
            <li
              key={chip}
              className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted"
            >
              <span aria-hidden="true" className="text-status-normal">🔒</span>
              {chip}
            </li>
          ))}
        </motion.ul>

        {/* Trust badges: social proof counter + free-plan note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 flex flex-col items-center justify-center gap-2 text-sm text-muted sm:flex-row sm:gap-6"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="text-status-normal text-base">✓</span>
            <SocialProofCounter target={2847} template={t('socialProof', { count: '{n}' })} />
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="text-status-normal text-base">✓</span>
            {t('freeNote')}
          </span>
        </motion.div>
      </div>
    </section>
  );
}

// Counts up from 0 to the target over ~1.2s, easing out. The final number is
// in the aria-label so screen readers never hear intermediate values.
function SocialProofCounter({ target, template }: { target: number; template: string }) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / 1200);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const [before, after] = template.split('{n}');
  return (
    <span aria-label={template.replace('{n}', target.toLocaleString())}>
      {before}
      <strong className="font-semibold text-foreground tabular-nums">
        {value.toLocaleString()}
      </strong>
      {after}
    </span>
  );
}
