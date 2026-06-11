import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://mediclear-web.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Results and account contain per-user data; nothing useful to index.
      disallow: ['/api/', '/tr/results', '/en/results', '/tr/account', '/en/account'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
