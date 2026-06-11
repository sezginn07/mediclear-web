'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

// Rotates through the loading messages while the analysis is in flight.
// role="status" + aria-live announce progress to screen readers.
export function AnalysisProgress() {
  const t = useTranslations('analyze.progress');
  const messages = t.raw('messages') as string[];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 2200);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-5 py-16"
    >
      <div
        aria-hidden="true"
        className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-primary"
      />
      <p className="text-center text-base font-medium text-foreground">
        {t('note')}
      </p>
      <p key={index} className="animate-pulse text-center text-sm text-muted">
        {messages[index]}
      </p>
      {/* Soft indeterminate progress bar */}
      <div aria-hidden="true" className="h-1.5 w-56 overflow-hidden rounded-full bg-primary-light">
        <div className="progress-soft h-full w-1/3 rounded-full bg-primary" />
      </div>
    </div>
  );
}
