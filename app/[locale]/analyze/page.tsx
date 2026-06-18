export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/landing/Footer';
import { AnalyzeClient } from '@/components/analyze/AnalyzeClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'analyze' });
  return { title: t('title') };
}

export default async function AnalyzePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { upgraded } = await searchParams;
  const t = await getTranslations('analyze');

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h1>
        <p className="mt-2 text-muted">{t('subtitle')}</p>
        <div className="mt-10">
          <AnalyzeClient upgraded={upgraded === 'true'} />
        </div>
      </main>
      <Footer />
    </>
  );
}
