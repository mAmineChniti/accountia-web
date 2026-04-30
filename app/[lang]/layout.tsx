import { type Locale, i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { Footer } from '@/components/reusable/footer';
import { type ReactNode } from 'react';
import { siteConfig } from '@/lib/seo/metadata';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const baseUrl = siteConfig.url;

  return {
    alternates: {
      canonical: `${baseUrl}/${lang}`,
      languages: {
        'en-US': `${baseUrl}/en`,
        'en-GB': `${baseUrl}/en`,
        'fr-FR': `${baseUrl}/fr`,
        'fr-CA': `${baseUrl}/fr`,
        'ar-SA': `${baseUrl}/ar`,
        'ar-AE': `${baseUrl}/ar`,
        'x-default': `${baseUrl}/en`,
      },
    },
    openGraph: {
      locale: lang === 'ar' ? 'ar_AR' : lang === 'fr' ? 'fr_FR' : 'en_US',
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);

  return (
    <>
      {children}
      <Footer dictionary={dictionary} />
    </>
  );
}
