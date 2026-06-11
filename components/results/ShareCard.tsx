'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import type { AnalysisResult, AnalysisStatus } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { getShareId } from '@/lib/referral';
import { getBaseUrl } from '@/lib/baseUrl';

const STATUS_EMOJI: Record<AnalysisStatus, string> = {
  normal: '🟢',
  warning: '🟡',
  urgent: '🔴',
};

const STATUS_GRADIENT: Record<AnalysisStatus, string> = {
  normal: 'linear-gradient(135deg, #f0fdf4 0%, #ebf3fd 100%)',
  warning: 'linear-gradient(135deg, #fffbeb 0%, #ebf3fd 100%)',
  urgent: 'linear-gradient(135deg, #fef2f2 0%, #ebf3fd 100%)',
};

// One short, non-sensitive insight: the first doctor question is preparation-
// oriented (no measured values); fall back to a truncated summary.
function pickInsight(result: AnalysisResult): string {
  const candidate = result.doctorQuestions[0] ?? result.summary;
  return candidate.length > 140 ? `${candidate.slice(0, 137)}…` : candidate;
}

export function ShareCard({ result }: { result: AnalysisResult }) {
  const t = useTranslations('results.shareCard');
  const ts = useTranslations('results.status');
  const locale = useLocale();
  const [shareUrl, setShareUrl] = useState(`${getBaseUrl()}/${locale}`);
  const [copied, setCopied] = useState(false);

  // Build the referral link: user id when logged in, guest share id otherwise.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await createClient().auth.getUser();
      const ref = data.user?.id ?? getShareId();
      if (!cancelled) setShareUrl(`${getBaseUrl()}/${locale}?ref=${ref}`);
    })();
    return () => { cancelled = true; };
  }, [locale]);

  const text = `${t('message')} ${shareUrl}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable (http / permissions) — silently ignore.
    }
  }

  return (
    <div className="no-print">
      <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
      <p className="mt-1 text-xs text-muted">{t('subtitle')}</p>

      {/* The card itself — designed to look good in a screenshot */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-4 overflow-hidden rounded-2xl border border-border shadow-sm"
        style={{ background: STATUS_GRADIENT[result.status] }}
      >
        <div className="p-6 text-center">
          <div aria-hidden="true" className="text-4xl">{STATUS_EMOJI[result.status]}</div>
          <p className="mt-2 text-lg font-bold tracking-tight text-foreground">
            {ts(result.status)}
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            {pickInsight(result)}
          </p>
          <p className="mt-5 text-xs font-semibold text-primary">{t('cta')}</p>
          <p className="mt-1 text-[11px] text-muted-soft">{t('analyzedBy')}</p>
        </div>
      </motion.div>

      {/* Share actions — WhatsApp first (primary channel in Turkey) */}
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t('whatsapp')}
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t('twitter')}
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:bg-slate-50"
        >
          {copied ? t('copied') : t('copyLink')}
        </button>
      </div>

      {/* Referral incentive */}
      <p className="mt-3 text-xs text-muted">🎁 {t('referralNote')}</p>
    </div>
  );
}
