import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans_Arabic } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from '@/components/reusable/providers';
import { TokenExpiration } from '@/components/reusable/token-expiration';
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: '--font-noto-sans-arabic',
  subsets: ['arabic'],
  weight: '400',
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
  return (
    <html className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} h-full antialiased`}
      >
        <Providers>
          <TokenExpiration />
          {children}
        </Providers>
      </body>
    </html>
  );
}
