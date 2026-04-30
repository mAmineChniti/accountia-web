import type { Metadata, Viewport } from 'next';
import type { Locale } from '@/i18n-config';

export const siteConfig = {
  name: 'Accountia',
  description:
    'AI-powered accounting and business management platform. Automate bookkeeping, invoicing, and tax preparation with intelligent financial automation.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://accountia.vercel.app/',
  ogImage: '/og-image.png',
  twitterHandle: '@accountia',
  keywords: [
    'accounting software',
    'AI accounting',
    'business management',
    'invoicing',
    'tax preparation',
    'bookkeeping automation',
    'financial management',
    'multitenant accounting',
    'AI-powered finance',
    'automated bookkeeping',
    'business intelligence',
    'financial automation',
  ],
  authors: [{ name: 'Accountia Team' }],
  creator: 'Accountia',
  publisher: 'Accountia',
} as const;

export const defaultViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

interface GenerateMetadataParams {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
}

export function generateSEOMetadata({
  title,
  description,
  path,
  locale,
  image = siteConfig.ogImage,
  type = 'website',
  publishedTime,
  modifiedTime,
  noIndex = false,
}: GenerateMetadataParams): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = image.startsWith('http')
    ? image
    : `${siteConfig.url}${image}`;

  const metadata: Metadata = {
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords: [...siteConfig.keywords],
    authors: [...siteConfig.authors],
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
      languages: {
        en: `${siteConfig.url}/en${path}`,
        fr: `${siteConfig.url}/fr${path}`,
        ar: `${siteConfig.url}/ar${path}`,
      },
    },
    openGraph: {
      type,
      locale,
      url,
      siteName: siteConfig.name,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: siteConfig.twitterHandle,
      site: siteConfig.twitterHandle,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };

  return metadata;
}

export function generateHomeMetadata(locale: Locale): Metadata {
  const titles: Record<Locale, string> = {
    en: 'AI-Powered Accounting & Business Management Platform',
    fr: "Plateforme de Comptabilité et Gestion d'Entreprise Alimentée par l'IA",
    ar: 'منصة المحاسبة وإدارة الأعمال المدعومة بالذكاء الاصطناعي',
  };

  const descriptions: Record<Locale, string> = {
    en: 'Transform your business with Accountia. AI-powered accounting automation, intelligent invoicing, tax preparation, and real-time financial insights for startups to enterprises.',
    fr: "Transformez votre entreprise avec Accountia. Automatisation comptable alimentée par l'IA, facturation intelligente, préparation fiscale et analyses financières en temps réel.",
    ar: 'حوّل عملك مع أكونتيا. أتمتة المحاسبة بالذكاء الاصطناعي، الفوترة الذكية، إعداد الضرائب، ورؤى مالية فورية.',
  };

  return generateSEOMetadata({
    title: titles[locale],
    description: descriptions[locale],
    path: '/',
    locale,
  });
}

export function generateLoginMetadata(locale: Locale): Metadata {
  const titles: Record<Locale, string> = {
    en: 'Login to Your Account',
    fr: 'Connexion à votre compte',
    ar: 'تسجيل الدخول إلى حسابك',
  };

  const descriptions: Record<Locale, string> = {
    en: 'Sign in to Accountia to access your AI-powered accounting dashboard, manage invoices, and view real-time financial insights.',
    fr: "Connectez-vous à Accountia pour accéder à votre tableau de bord comptable alimenté par l'IA.",
    ar: 'سجّل الدخول إلى أكونتيا للوصول إلى لوحة تحكم المحاسبة الذكية.',
  };

  return generateSEOMetadata({
    title: titles[locale],
    description: descriptions[locale],
    path: '/login',
    locale,
    noIndex: true,
  });
}

export function generateRegisterMetadata(locale: Locale): Metadata {
  const titles: Record<Locale, string> = {
    en: 'Create Your Free Account',
    fr: 'Créez votre compte gratuit',
    ar: 'أنشئ حسابك المجاني',
  };

  const descriptions: Record<Locale, string> = {
    en: 'Start your free trial with Accountia. Set up AI-powered accounting for your business in minutes. No credit card required.',
    fr: "Commencez votre essai gratuit avec Accountia. Configurez la comptabilité alimentée par l'IA en quelques minutes.",
    ar: 'ابدأ تجربتك المجانية مع أكونتيا. اعداد المحاسبة الذكية لعملك في دقائق.',
  };

  return generateSEOMetadata({
    title: titles[locale],
    description: descriptions[locale],
    path: '/register',
    locale,
    noIndex: true,
  });
}

export function generateForgotPasswordMetadata(locale: Locale): Metadata {
  const titles: Record<Locale, string> = {
    en: 'Reset Your Password',
    fr: 'Réinitialiser votre mot de passe',
    ar: 'إعادة تعيين كلمة المرور',
  };

  return generateSEOMetadata({
    title: titles[locale],
    description: 'Reset your Accountia password securely.',
    path: '/forgot-password',
    locale,
    noIndex: true,
  });
}

export function generateProfileMetadata(locale: Locale): Metadata {
  const titles: Record<Locale, string> = {
    en: 'Your Profile',
    fr: 'Votre profil',
    ar: 'ملفك الشخصي',
  };

  return generateSEOMetadata({
    title: titles[locale],
    description: 'Manage your Accountia account settings and preferences.',
    path: '/profile',
    locale,
    noIndex: true,
  });
}

export function generateBusinessMetadata(
  locale: Locale,
  businessName?: string
): Metadata {
  const titles: Record<Locale, string> = {
    en: businessName ? `${businessName} Dashboard` : 'Business Dashboard',
    fr: businessName
      ? `Tableau de bord ${businessName}`
      : "Tableau de bord d'entreprise",
    ar: businessName ? `لوحة تحكم ${businessName}` : 'لوحة تحكم الأعمال',
  };

  return generateSEOMetadata({
    title: titles[locale],
    description: 'Manage your business finances, invoices, and analytics.',
    path: '/business',
    locale,
    noIndex: true,
  });
}

export function generateInvoicesMetadata(locale: Locale): Metadata {
  const titles: Record<Locale, string> = {
    en: 'Manage Your Invoices',
    fr: 'Gérez vos factures',
    ar: 'إدارة الفواتير',
  };

  return generateSEOMetadata({
    title: titles[locale],
    description: 'Create, send, and track invoices with AI-powered automation.',
    path: '/invoices',
    locale,
    noIndex: true,
  });
}

export function generateAdminMetadata(locale: Locale): Metadata {
  const titles: Record<Locale, string> = {
    en: 'Admin Dashboard',
    fr: "Tableau de bord d'administration",
    ar: 'لوحة تحكم المشرف',
  };

  return generateSEOMetadata({
    title: titles[locale],
    description: 'Administrative dashboard for managing users and businesses.',
    path: '/dashboard/admin',
    locale,
    noIndex: true,
  });
}

export function generateBusinessApplicationMetadata(locale: Locale): Metadata {
  const titles: Record<Locale, string> = {
    en: 'Apply for Business Account',
    fr: "Demander un compte d'entreprise",
    ar: 'التقدم بطلب حساب تجاري',
  };

  return generateSEOMetadata({
    title: titles[locale],
    description: 'Apply for a business account on Accountia.',
    path: '/business-application',
    locale,
    noIndex: true,
  });
}
