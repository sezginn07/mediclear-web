'use client';

import { useTranslations } from 'next-intl';
import { useInView } from '@/lib/useInView';
import {
  FileHeartIcon,
  LayersIcon,
  UploadIcon,
} from '@/components/ui/icons';

const STEPS = [
  { key: 'upload', Icon: UploadIcon },
  { key: 'select', Icon: LayersIcon },
  { key: 'understand', Icon: FileHeartIcon },
] as const;

function Step({
  number,
  Icon,
  title,
  description,
  delay,
}: {
  number: number;
  Icon: typeof UploadIcon;
  title: string;
  description: string;
  delay: number;
}) {
  const ref = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="anim-slide-left relative text-center"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-md shadow-blue-600/10 ring-1 ring-border">
        <Icon className="h-7 w-7" />
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {number}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
        {description}
      </p>
    </div>
  );
}

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  return (
    <section id="how-it-works" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h2>

        <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {/* Dashed connector between step icons (desktop only) */}
          <div
            aria-hidden="true"
            className="absolute left-[16.66%] right-[16.66%] top-8 hidden border-t-2 border-dashed border-blue-200 md:block"
          />
          {STEPS.map(({ key, Icon }, i) => (
            <Step
              key={key}
              number={i + 1}
              Icon={Icon}
              title={t(`steps.${key}.title`)}
              description={t(`steps.${key}.description`)}
              delay={i * 120}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
