'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { CategoryId, Lang } from '@/lib/types';
import {
  canAnalyze,
  getUsage,
  incrementCount,
  isPremium,
  setPremium,
  type UsageSnapshot,
} from '@/lib/freemium';
import { saveResult } from '@/lib/resultStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileUploader } from './FileUploader';
import { CategorySelector } from './CategorySelector';
import { AnalysisProgress } from './AnalysisProgress';

export function AnalyzeClient({ upgraded }: { upgraded: boolean }) {
  const t = useTranslations('analyze');
  const locale = useLocale() as Lang;
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);

  // Honor the Stripe success redirect (?upgraded=true) and load usage.
  useEffect(() => {
    if (upgraded) setPremium(true);
    setUsage(getUsage());
  }, [upgraded]);

  const limitReached = usage ? !usage.canAnalyze : false;

  async function handleSubmit() {
    setError(null);
    if (!file) return setError(t('errors.noFile'));
    if (!category) return setError(t('errors.noCategory'));
    if (!canAnalyze()) return setError(t('errors.limitReached'));

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('category', category);
      form.append('lang', locale);

      const res = await fetch('/api/analyze', { method: 'POST', body: form });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { code?: string };
        const key = data.code && messageKeys.has(data.code) ? data.code : 'generic';
        setError(t(`errors.${key}`));
        setSubmitting(false);
        return;
      }

      const result = await res.json();
      incrementCount();
      saveResult(result);
      router.push('/results');
    } catch {
      setError(t('errors.network'));
      setSubmitting(false);
    }
  }

  if (submitting) return <AnalysisProgress />;

  return (
    <div className="space-y-8">
      {/* Usage meter */}
      {usage && (
        <p className="text-sm text-muted">
          {isPremium()
            ? t('usagePremium', { count: usage.count, limit: usage.limit })
            : t('usageFree', { count: usage.count, limit: usage.limit })}
        </p>
      )}

      {limitReached ? (
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            {t('limitGate.title')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {t('limitGate.description')}
          </p>
          <Button className="mt-6" onClick={() => router.push('/pricing')}>
            {t('limitGate.cta')}
          </Button>
        </Card>
      ) : (
        <>
          <FileUploader
            file={file}
            onSelect={(f) => {
              setFile(f);
              setError(null);
            }}
            onError={(key) => setError(t(`errors.${key}`))}
          />

          <CategorySelector value={category} onChange={setCategory} />

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-status-urgent ring-1 ring-red-200">
              {error}
            </p>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={!file || !category}
          >
            {t('submit')}
          </Button>
        </>
      )}
    </div>
  );
}

// Error codes returned by /api/analyze that map to translation keys.
const messageKeys = new Set([
  'config',
  'auth',
  'rate_limit',
  'server',
  'parse',
  'network',
  'tooLarge',
  'badType',
  'limitReached',
]);
