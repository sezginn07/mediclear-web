'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AnalysisResult } from '@/lib/types';
import { loadResult } from '@/lib/resultStore';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { ResultsCard } from './ResultsCard';

export function ResultsClient() {
  const t = useTranslations('results');
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setResult(loadResult());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  // No result in session — send the user back to analyze.
  if (!result) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">{t('analyzeAnother')}</p>
        <Button className="mt-6" onClick={() => router.push('/analyze')}>
          {t('analyzeAnother')}
        </Button>
      </div>
    );
  }

  return <ResultsCard result={result} />;
}
