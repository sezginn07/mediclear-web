export const dynamic = 'force-dynamic';

import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/ui/Header';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Testimonials } from '@/components/landing/Testimonials';
import { Pricing } from '@/components/landing/Pricing';
import { Faq } from '@/components/landing/Faq';
import { Footer } from '@/components/landing/Footer';

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'MediClear',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  description:
    'AI assistant that translates medical reports into plain language. Not medical advice.',
  url: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://mediclear-web.vercel.app',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Header />
      <main id="main">
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
