'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AnalysisResult } from '@/lib/types';
import { Button } from '@/components/ui/Button';

function resultToText(r: AnalysisResult): string {
  const lines: string[] = [r.summary, ''];
  if (r.urgency) lines.push(r.urgency, '');
  if (r.keyFindings.length) lines.push(...r.keyFindings.map((f) => `• ${f}`), '');
  lines.push(r.disclaimer);
  return lines.join('\n');
}

export function ShareButton({ result }: { result: AnalysisResult }) {
  const t = useTranslations('results');
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = resultToText(result);
    // Prefer the native Web Share API where available.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'MediClear', text });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more we can do silently
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={share}>
      {copied ? t('shareCopied') : t('share')}
    </Button>
  );
}
