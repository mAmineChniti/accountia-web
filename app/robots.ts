import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://accountia.io';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/_next/',
          '/en/profile',
          '/fr/profile',
          '/ar/profile',
          '/en/business/',
          '/fr/business/',
          '/ar/business/',
          '/en/invoices',
          '/fr/invoices',
          '/ar/invoices',
          '/en/business-application',
          '/fr/business-application',
          '/ar/business-application',
          '/en/dashboard/',
          '/fr/dashboard/',
          '/ar/dashboard/',
          '/*/auth/callback',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: [
          '/api/',
          '/_next/',
          '/*/profile',
          '/*/business/',
          '/*/invoices',
          '/*/dashboard/',
          '/*/business-application',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
