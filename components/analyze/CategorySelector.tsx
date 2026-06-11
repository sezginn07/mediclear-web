'use client';

import { useTranslations } from 'next-intl';
import type { CategoryId } from '@/lib/types';
import { CATEGORY_IDS } from '@/lib/types';
import { cn } from '@/lib/cn';

// Emojis match the mobile app's category list.
const ICONS: Record<CategoryId, string> = {
  blood: '🩸',
  radiology: '🩻',
  pathology: '🔬',
  cardiology: '❤️',
  hormone: '⚗️',
  general: '📄',
};

export function CategorySelector({
  value,
  onChange,
}: {
  value: CategoryId | null;
  onChange: (c: CategoryId) => void;
}) {
  const t = useTranslations('analyze.category');

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORY_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors',
              value === id
                ? 'border-primary bg-blue-50 ring-1 ring-primary'
                : 'border-border bg-white hover:border-slate-300',
            )}
            aria-pressed={value === id}
          >
            <span aria-hidden="true" className="text-2xl">{ICONS[id]}</span>
            <span className="text-sm font-medium text-foreground">
              {t(id)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
