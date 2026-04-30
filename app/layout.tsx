import type { Metadata, Viewport } from 'next';
import { defaultViewport } from '@/lib/seo/metadata';
import { Geist, Geist_Mono, Noto_Sans_Arabic } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from '@/components/reusable/providers';
import { TokenExpiration } from '@/components/reusable/token-expiration';
import { FocusRouteHandler } from '@/components/reusable/focus-route-handler';
import { headers } from 'next/headers';
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: '--font-noto-sans-arabic',
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Accountia - AI-Powered Accounting & Business Management',
    template: '%s | Accountia',
  },
  description:
    'Transform your business with Accountia. AI-powered accounting automation, intelligent invoicing, tax preparation, and real-time financial insights for startups to enterprises.',
  keywords: [
    'accounting software',
    'AI accounting',
    'business management',
    'invoicing',
    'tax preparation',
    'bookkeeping automation',
    'financial management',
  ],
  authors: [{ name: 'Accountia Team' }],
  creator: 'Accountia',
  publisher: 'Accountia',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://accountia.io'
  ),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en',
    url: '/',
    siteName: 'Accountia',
    title: 'Accountia - AI-Powered Accounting & Business Management',
    description:
      'Transform your business with AI-powered accounting automation.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Accountia - AI-Powered Accounting Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accountia - AI-Powered Accounting & Business Management',
    description:
      'Transform your business with AI-powered accounting automation.',
    images: ['/og-image.png'],
  },
  robots: {
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

export const viewport: Viewport = defaultViewport;

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const locale = headersList.get('x-locale') ?? 'en';

  const isArabic = locale.split('-')[0] === 'ar';

  return (
    <html
      lang={locale}
      dir={isArabic ? 'rtl' : 'ltr'}
      className="h-full"
      suppressHydrationWarning
    >
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          notoSansArabic.variable,
          'h-full antialiased',
          isArabic ? 'font-arabic' : 'font-sans'
        )}
      >
        <Providers>
          <FocusRouteHandler />
          <TokenExpiration />
          {children}
        </Providers>
      </body>
    </html>
  );
}
