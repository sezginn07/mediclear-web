'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { useInView } from '@/lib/useInView';
import { ChevronDownIcon } from '@/components/ui/icons';

interface FaqItem {
  question: string;
  answer: string;
}

export function Faq() {
  const t = useTranslations('faq');
  const items = t.raw('items') as FaqItem[];
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useInView<HTMLDivElement>();

  return (
    <section id="faq" className="border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h2>

        <div
          ref={ref}
          className="anim-fade-up mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
        >
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={cn(
                  'transition-colors duration-200',
                  isOpen ? 'bg-blue-50/40' : 'hover:bg-slate-50',
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className={cn(
                      'font-medium transition-colors duration-200',
                      isOpen ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {item.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                      isOpen
                        ? 'rotate-180 bg-primary text-primary-foreground'
                        : 'bg-slate-100 text-muted',
                    )}
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </button>
                {/* grid-rows trick animates to content height without magic max-height */}
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-relaxed text-muted">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
