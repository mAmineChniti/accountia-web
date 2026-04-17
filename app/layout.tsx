import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans_Arabic } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from '@/components/reusable/providers';
import { TokenExpiration } from '@/components/reusable/token-expiration';
import { FocusRouteHandler } from '@/components/reusable/focus-route-handler';
import { headers } from 'next/headers';

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
  title: 'Accountia',
  description: 'Multi-language accounting and finance management platform',
};

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
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} h-full antialiased ${isArabic ? 'font-arabic' : 'font-sans'}`}
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
