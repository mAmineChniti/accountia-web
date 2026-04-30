import type { MetadataRoute } from 'next';
import { i18n } from '@/i18n-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://accountia.io';

  const routes = [
    '',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of i18n.locales) {
    for (const route of routes) {
      const path = locale === i18n.defaultLocale ? route : `/${locale}${route}`;
      const url = `${baseUrl}${path}`;

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'monthly',
        priority: route === '' ? 1 : 0.5,
        alternates: {
          languages: Object.fromEntries(
            i18n.locales.map((l) => [
              l,
              `${baseUrl}${l === i18n.defaultLocale ? route : `/${l}${route}`}`,
            ])
          ),
        },
      });
    }
  }

  return sitemapEntries;
}
