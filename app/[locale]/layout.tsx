import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import '../globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://mediclear-web.vercel.app';

const META: Record<string, { title: string; description: string }> = {
  tr: {
    title: 'MediClear — Tıbbi raporlarınızı anlaşılır dile çevirin',
    description:
      'Kan tahlili, MR, patoloji ve diğer tıbbi raporlarınızı yükleyin; saniyeler içinde sade Türkçe açıklama alın. Tıbbi tavsiye değildir.',
  },
  en: {
    title: 'MediClear — Understand your medical reports',
    description:
      'Upload your medical report and get a plain-language explanation in seconds. Not medical advice.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = META[locale] ?? META.tr;
  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: meta.title,
      template: '%s | MediClear',
    },
    description: meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { tr: '/tr', en: '/en', 'x-default': '/tr' },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `/${locale}`,
      siteName: 'MediClear',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
}

// Pre-render both locales at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for this locale.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
