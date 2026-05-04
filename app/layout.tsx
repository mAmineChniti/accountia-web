import type { Metadata } from 'next';
// On commente l'import Google pour éviter l'erreur de connexion
// import { Geist, Geist_Mono, Noto_Sans_Arabic } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from '@/components/reusable/providers';
import { TokenExpiration } from '@/components/reusable/token-expiration';
import { FocusRouteHandler } from '@/components/reusable/focus-route-handler';
import { headers } from 'next/headers';
import { cn } from '@/lib/utils';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

// On simule les polices pour que le code continue de fonctionner sans erreur
const geistSans = { variable: '--font-geist-sans' };
const geistMono = { variable: '--font-geist-mono' };
const notoSansArabic = { variable: '--font-noto-sans-arabic' };

export const metadata: Metadata = {
  title: 'Accountia',
  description: 'Multi-language accounting and finance management platform',
  icons: {
    icon: '/favicon.ico?v=2',
  },
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
