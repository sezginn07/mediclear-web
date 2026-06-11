export const dynamic = 'force-dynamic';

import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/landing/Footer';
import { Pricing } from '@/components/landing/Pricing';

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
