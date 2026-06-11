'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

// Rotates through the loading messages while the analysis is in flight.
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
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-primary" />
      <p
        key={index}
        className="animate-pulse text-center text-sm font-medium text-muted"
      >
        {messages[index]}
      </p>
    </div>
  );
}
