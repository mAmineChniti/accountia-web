import type { Locale } from '@/i18n-config';
import { siteConfig } from './metadata';

interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  description: string;
  url: string;
  logo: string;
  sameAs: string[];
  contactPoint: {
    '@type': 'ContactPoint';
    contactType: string;
    availableLanguage: string[];
  };
}

interface SoftwareApplicationSchema {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
  aggregateRating: {
    '@type': 'AggregateRating';
    ratingValue: string;
    ratingCount: string;
  };
  featureList: string;
}

interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  potentialAction: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

interface BreadcrumbListSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

export function generateOrganizationSchema(locale: Locale): OrganizationSchema {
  const url = siteConfig.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    description: siteConfig.description,
    url: url,
    logo: `${url}/logo.png`,
    sameAs: [
      'https://twitter.com/accountia',
      'https://linkedin.com/company/accountia',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English', 'French', 'Arabic'],
    },
  };
}

export function generateSoftwareApplicationSchema(
  locale: Locale
): SoftwareApplicationSchema {
  const descriptions: Record<Locale, string> = {
    en: 'AI-powered accounting and business management platform with automated bookkeeping, invoicing, and tax preparation.',
    fr: "Plateforme de comptabilité et gestion d'entreprise alimentée par l'IA avec tenue de livres automatisée.",
    ar: 'منصة المحاسبة وإدارة الأعمال المدعومة بالذكاء الاصطناعي مع أتمتة الدفاتر والفوترة.',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    description: descriptions[locale],
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1000',
    },
    featureList:
      'AI-powered accounting, Automated invoicing, Tax preparation, Real-time analytics, Multi-business management',
  };
}

export function generateWebSiteSchema(locale: Locale): WebSiteSchema {
  const url = siteConfig.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; path: string }[],
  locale: Locale
): BreadcrumbListSchema {
  const url = siteConfig.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${url}/${locale}${item.path}`,
    })),
  };
}

interface SchemaScriptProps {
  schema: object;
}

export function SchemaScript({ schema }: SchemaScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationSchemaScript({ locale }: { locale: Locale }) {
  return <SchemaScript schema={generateOrganizationSchema(locale)} />;
}

export function SoftwareApplicationSchemaScript({
  locale,
}: {
  locale: Locale;
}) {
  return <SchemaScript schema={generateSoftwareApplicationSchema(locale)} />;
}

export function WebSiteSchemaScript({ locale }: { locale: Locale }) {
  return <SchemaScript schema={generateWebSiteSchema(locale)} />;
}

export function BreadcrumbSchemaScript({
  items,
  locale,
}: {
  items: { name: string; path: string }[];
  locale: Locale;
}) {
  return <SchemaScript schema={generateBreadcrumbSchema(items, locale)} />;
}
