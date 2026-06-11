import { useTranslations } from 'next-intl';
import type { AnalysisStatus } from '@/lib/types';
import { cn } from '@/lib/cn';

const STYLES: Record<AnalysisStatus, string> = {
  normal: 'bg-green-50 text-green-700 ring-green-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  urgent: 'bg-red-50 text-red-700 ring-red-200',
};

const SIZES = {
  md: 'px-3 py-1 text-sm',
  lg: 'px-5 py-2 text-lg',
} as const;

export function StatusBadge({
  status,
  size = 'md',
}: {
  status: AnalysisStatus;
  size?: keyof typeof SIZES;
}) {
  const t = useTranslations('results.status');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold ring-1',
        STYLES[status],
        SIZES[size],
      )}
    >
      {t(status)}
    </span>
  );
}
