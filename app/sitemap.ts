import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://mediclear-web.vercel.app';

const PUBLIC_PATHS = ['', '/analyze', '/pricing', '/terms', '/auth/login', '/auth/register'];
const LOCALES = ['tr', 'en'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${BASE_URL}/${l}${path}`]),
        ),
      },
    })),
  );
}
