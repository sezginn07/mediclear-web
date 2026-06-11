'use client';

import { useTranslations } from 'next-intl';
import { useInView } from '@/lib/useInView';

const STEPS = ['upload', 'select', 'understand'] as const;

function Step({
  number,
  title,
  description,
  delay,
}: {
  number: number;
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
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
        {number}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
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

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Step
              key={step}
              number={i + 1}
              title={t(`steps.${step}.title`)}
              description={t(`steps.${step}.description`)}
              delay={i * 120}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
