'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import type { AnalysisResult, AnalysisStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { ShareButton } from './ShareButton';
import { ShareCard } from './ShareCard';

// Step 1 — the Relief Moment. One large, calm sentence before any values.
const HERO_STYLES: Record<AnalysisStatus, string> = {
  normal: 'bg-green-50 text-green-800 ring-green-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  urgent: 'bg-red-50 text-red-800 ring-red-200',
};

const HERO_EMOJI: Record<AnalysisStatus, string> = {
  normal: '🟢',
  warning: '🟡',
  urgent: '🔴',
};

function ListSection({
  title,
  items,
  marker,
  markerClass,
  numbered = false,
}: {
  title: string;
  items: string[];
  marker?: string;
  markerClass?: string;
  numbered?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ol className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
            {numbered ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                {i + 1}
              </span>
            ) : (
              <span aria-hidden="true" className={markerClass}>{marker}</span>
            )}
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ResultsCard({ result }: { result: AnalysisResult }) {
  const t = useTranslations('results');

  return (
    <div className="space-y-6">
      {/* ── Step 1: Relief — large status sentence, gentle fade-in ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={`rounded-2xl px-6 py-8 text-center ring-1 ${HERO_STYLES[result.status]}`}
      >
        <span aria-hidden="true" className="text-3xl">{HERO_EMOJI[result.status]}</span>
        <p className="mx-auto mt-3 max-w-xl text-[32px] font-bold leading-tight tracking-tight">
          {t(`statusHeadline.${result.status}`)}
        </p>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 no-print">
        <ShareButton result={result} />
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          {t('print')}
        </Button>
      </div>

      {/* Summary + urgency */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground">{t('summary')}</h2>
        <p className="mt-2 leading-relaxed text-foreground">{result.summary}</p>
        {result.urgency && (
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">{t('urgency')}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{result.urgency}</p>
          </div>
        )}
      </Card>

      {/* Key findings */}
      {result.keyFindings.length > 0 && (
        <Card className="p-6">
          <ListSection
            title={t('keyFindings')}
            items={result.keyFindings}
            marker="•"
            markerClass="text-primary"
          />
        </Card>
      )}

      {/* ── Step 2: Empowerment — framed as preparation, not diagnosis ── */}
      {result.doctorQuestions.length > 0 && (
        <Card className="p-6">
          <ListSection
            title={t('doctorPrep')}
            items={result.doctorQuestions}
            marker="?"
            markerClass="font-bold text-primary"
          />
        </Card>
      )}

      {/* ── Step 3: Action — "What should you do now?" numbered ── */}
      {(result.doList.length > 0 || result.dontList.length > 0) && (
        <Card className="p-6">
          <h2 className="text-base font-bold text-foreground">{t('nextSteps')}</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {result.doList.length > 0 && (
              <ListSection title={t('doList')} items={result.doList} numbered />
            )}
            {result.dontList.length > 0 && (
              <ListSection
                title={t('dontList')}
                items={result.dontList}
                marker="✕"
                markerClass="text-status-urgent"
              />
            )}
          </div>
        </Card>
      )}

      {/* Viral loop: shareable summary card (no sensitive values) */}
      <Card className="p-6">
        <ShareCard result={result} />
      </Card>

      {/* ── Step 4: Closure — share with doctor + calm reassurance ── */}
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <h3 className="text-base font-semibold text-foreground">{t('closure.title')}</h3>
        <div className="mt-4 flex justify-center no-print">
          <Button onClick={() => window.print()}>{t('closure.shareDoctor')}</Button>
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          {t('closure.reassurance')}
        </p>
        <p className="mt-3 text-xs text-muted-soft">{result.disclaimer}</p>
        <p className="mt-2 text-xs text-muted-soft">{t('analyzedBy')}</p>
      </div>

      <div className="flex justify-center pt-2 no-print">
        <Link href="/analyze">
          <Button variant="secondary">{t('analyzeAnother')}</Button>
        </Link>
      </div>
    </div>
  );
}
