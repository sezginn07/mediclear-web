'use client';

import { useTranslations } from 'next-intl';
import { useInView } from '@/lib/useInView';
import { Card } from '@/components/ui/Card';

const ITEMS = [
  { key: 'instant', icon: '⚡' },
  { key: 'plainLanguage', icon: '💬' },
  { key: 'private', icon: '🔒' },
] as const;

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: number;
}) {
  const ref = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="anim-fade-up"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Card
        className="h-full p-8 transition-shadow duration-200 hover:shadow-md"
        style={{ borderTopWidth: '3px', borderTopColor: 'transparent' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderTopColor = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderTopColor = 'transparent';
        }}
      >
        <div className="text-3xl">{icon}</div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      </Card>
    </div>
  );
}

export function Features() {
  const t = useTranslations('features');

  return (
    <section id="features" className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {t('title')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">{t('subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {ITEMS.map(({ key, icon }, i) => (
            <FeatureCard
              key={key}
              icon={icon}
              title={t(`items.${key}.title`)}
              description={t(`items.${key}.description`)}
              delay={i * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
