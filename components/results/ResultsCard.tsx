'use client';

import { useTranslations } from 'next-intl';
import type { AnalysisResult } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { StatusBadge } from './StatusBadge';
import { ShareButton } from './ShareButton';

function ListSection({
  title,
  items,
  marker,
  markerClass,
  defaultOpen = true,
}: {
  title: string;
  items: string[];
  marker: string;
  markerClass: string;
  defaultOpen?: boolean;
}) {
  if (!items.length) return null;
  return (
    <details open={defaultOpen} className="group">
      <summary className="cursor-pointer list-none text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        <span
          aria-hidden="true"
          className="mr-2 inline-block text-muted transition-transform group-open:rotate-90"
        >
          ›
        </span>
        {title}
      </summary>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <span aria-hidden="true" className={markerClass}>{marker}</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function ResultsCard({ result }: { result: AnalysisResult }) {
  const t = useTranslations('results');

  return (
    <div className="space-y-6">
      {/* Calm framing: overall picture first */}
      <p className="text-sm text-muted">{t('intro')}</p>

      {/* Header: large status badge + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <StatusBadge status={result.status} size="lg" />
        <div className="flex gap-2 no-print">
          <ShareButton result={result} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
          >
            {t('print')}
          </Button>
        </div>
      </div>

      {/* Summary — always first, always visible */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground">{t('summary')}</h2>
        <p className="mt-2 leading-relaxed text-foreground">{result.summary}</p>
        {result.urgency && (
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t('urgency')}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {result.urgency}
            </p>
          </div>
        )}
      </Card>

      {/* Key findings — important, expanded by default */}
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

      {/* Doctor questions */}
      {result.doctorQuestions.length > 0 && (
        <Card className="p-6">
          <ListSection
            title={t('doctorQuestions')}
            items={result.doctorQuestions}
            marker="?"
            markerClass="font-bold text-primary"
          />
        </Card>
      )}

      {/* Do / Don't grouped together */}
      {(result.doList.length > 0 || result.dontList.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {result.doList.length > 0 && (
            <Card className="p-6">
              <ListSection
                title={t('doList')}
                items={result.doList}
                marker="✓"
                markerClass="text-status-normal"
              />
            </Card>
          )}
          {result.dontList.length > 0 && (
            <Card className="p-6">
              <ListSection
                title={t('dontList')}
                items={result.dontList}
                marker="✕"
                markerClass="text-status-urgent"
              />
            </Card>
          )}
        </div>
      )}

      {/* Disclaimer — visible but calm, not an alarming warning box */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-foreground">
          {t('disclaimer')}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {result.disclaimer}
        </p>
        <p className="mt-3 text-xs text-muted">{t('analyzedBy')}</p>
      </div>

      <div className="flex justify-center pt-2 no-print">
        <Link href="/analyze">
          <Button>{t('analyzeAnother')}</Button>
        </Link>
      </div>
    </div>
  );
}
