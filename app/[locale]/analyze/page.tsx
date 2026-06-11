export const dynamic = 'force-dynamic';

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/landing/Footer';
import { AnalyzeClient } from '@/components/analyze/AnalyzeClient';

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
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
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
