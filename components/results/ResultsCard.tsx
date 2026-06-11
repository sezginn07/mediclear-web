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
}: {
  title: string;
  items: string[];
  marker: string;
  markerClass: string;
}) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <span className={markerClass}>{marker}</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResultsCard({ result }: { result: AnalysisResult }) {
  const t = useTranslations('results');

  return (
    <div className="space-y-6">
      {/* Header: status + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <StatusBadge status={result.status} />
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

      {/* Summary */}
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

      {/* Do / Don't */}
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

      {/* Disclaimer — amber */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="text-sm font-semibold text-amber-800">
          {t('disclaimer')}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-amber-700">
          {result.disclaimer}
        </p>
      </div>

      <div className="flex justify-center pt-2 no-print">
        <Link href="/analyze">
          <Button>{t('analyzeAnother')}</Button>
        </Link>
      </div>
    </div>
  );
}
