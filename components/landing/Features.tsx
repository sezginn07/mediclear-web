'use client';

import { useTranslations } from 'next-intl';
import { useInView } from '@/lib/useInView';
import { Card } from '@/components/ui/Card';
import {
  MessageHeartIcon,
  ShieldCheckIcon,
  ZapIcon,
} from '@/components/ui/icons';

const ITEMS = [
  { key: 'instant', Icon: ZapIcon },
  { key: 'plainLanguage', Icon: MessageHeartIcon },
  { key: 'private', Icon: ShieldCheckIcon },
] as const;

function FeatureCard({
  Icon,
  title,
  description,
  delay,
}: {
  Icon: typeof ZapIcon;
  title: string;
  description: string;
  delay: number;
}) {
  const ref = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="anim-fade-up group h-full"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Card className="relative h-full overflow-hidden p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-600/5">
        {/* Top accent line slides in on hover */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
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
          {ITEMS.map(({ key, Icon }, i) => (
            <FeatureCard
              key={key}
              Icon={Icon}
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
