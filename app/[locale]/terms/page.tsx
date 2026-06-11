export const dynamic = 'force-dynamic';

import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/landing/Footer';

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'terms' });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h1>

        {/* Medical Disclaimer — prominent */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="font-semibold text-amber-800">{t('disclaimer.heading')}</p>
          <p className="mt-1 text-sm text-amber-700">{t('disclaimer.body')}</p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-lg font-semibold">{t('sections.service.title')}</h2>
            <p className="mt-2 text-muted">{t('sections.service.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t('sections.medical.title')}</h2>
            <p className="mt-2 text-muted">{t('sections.medical.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t('sections.user.title')}</h2>
            <p className="mt-2 text-muted">{t('sections.user.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t('sections.subscription.title')}</h2>
            <p className="mt-2 text-muted">{t('sections.subscription.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t('sections.liability.title')}</h2>
            <p className="mt-2 text-muted">{t('sections.liability.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t('sections.contact.title')}</h2>
            <p className="mt-2 text-muted">{t('sections.contact.body')}</p>
          </section>
        </div>

        <p className="mt-10 text-xs text-muted">{t('lastUpdated')}</p>
      </main>
      <Footer />
    </>
  );
}
