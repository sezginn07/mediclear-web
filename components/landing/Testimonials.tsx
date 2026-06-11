'use client';

import { useTranslations } from 'next-intl';
import { useInView } from '@/lib/useInView';
import { Card } from '@/components/ui/Card';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

function TestimonialCard({ item, delay }: { item: Testimonial; delay: number }) {
  const ref = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="anim-fade-up"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Card className="flex h-full flex-col p-8">
        <span aria-hidden="true" className="text-3xl leading-none text-primary">
          &ldquo;
        </span>
        <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
          {item.quote}
        </blockquote>
        <footer className="mt-6 border-t border-border pt-4">
          <p className="text-sm font-semibold text-foreground">{item.name}</p>
          <p className="text-xs text-muted">{item.role}</p>
        </footer>
      </Card>
    </div>
  );
}

export function Testimonials() {
  const t = useTranslations('testimonials');
  const items = t.raw('items') as Testimonial[];

  return (
    <section id="testimonials" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {t('title')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">{t('subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <TestimonialCard key={item.name} item={item} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
