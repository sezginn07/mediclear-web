'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import {
  ArrowRightIcon,
  CheckIcon,
  EyeOffIcon,
  LockIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@/components/ui/icons';

// Trust chips are positional: encryption / no-storage / compliance.
const CHIP_ICONS = [LockIcon, EyeOffIcon, ShieldCheckIcon];

// Below this many real analyses we hide the counter rather than show a tiny or
// zero number. Keeps the social proof honest (no fabricated floor).
const MIN_SOCIAL_PROOF = 100;

export function Hero() {
  const t = useTranslations('hero');
  // Real, all-time analysis count from /api/stats. null = not loaded yet; we
  // only render the counter once we have a real number above the threshold.
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { total?: number } | null) => {
        if (!cancelled && typeof d?.total === 'number') setTotalCount(d.total);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #E8F2FC 0%, #f8fafd 100%)' }}
    >
      {/* Animated gradient backdrop — soft drifting blobs behind the content */}
      <div aria-hidden="true" className="absolute inset-0">
        <div
          className="hero-blob hero-blob-a -top-24 left-[8%] h-96 w-96 opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(26,111,212,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="hero-blob hero-blob-b -bottom-32 right-[5%] h-[28rem] w-[28rem] opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(34,197,194,0.14) 0%, transparent 70%)' }}
        />
        <div
          className="hero-blob hero-blob-a top-1/3 right-[30%] h-72 w-72 opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(26,111,212,0.12) 0%, transparent 70%)', animationDelay: '-9s' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm"
        >
          <SparklesIcon className="h-4 w-4" />
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
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted"
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
            <Button size="lg" className="group shadow-lg shadow-blue-600/20">
              {t('cta')}
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="secondary" className="bg-white/80 backdrop-blur-sm">
              {t('ctaSecondary')}
            </Button>
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
          {(t.raw('trustChips') as string[]).map((chip, i) => {
            const Icon = CHIP_ICONS[i % CHIP_ICONS.length];
            return (
              <li
                key={chip}
                className="flex items-center gap-1.5 rounded-full border border-border bg-white/90 px-3 py-1.5 text-xs font-medium text-muted shadow-sm backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 text-status-normal" />
                {chip}
              </li>
            );
          })}
        </motion.ul>

        {/* Trust badges: social proof counter + free-plan note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 flex flex-col items-center justify-center gap-2 text-sm text-muted sm:flex-row sm:gap-6"
        >
          {totalCount !== null && totalCount >= MIN_SOCIAL_PROOF && (
            <span className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-status-normal" />
              <SocialProofCounter target={totalCount} template={t('socialProof', { count: '{n}' })} />
            </span>
          )}
          <span className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-status-normal" />
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
