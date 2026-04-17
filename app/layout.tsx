import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from '@/components/reusable/providers';
import { TokenExpiration } from '@/components/reusable/token-expiration';
import { headers } from 'next/headers';

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

  return (
    <html
      lang={locale}
      dir={locale.split('-')[0] === 'ar' ? 'rtl' : 'ltr'}
      className="h-full"
      suppressHydrationWarning
    >
      <body className="h-full font-sans antialiased">
        <Providers>
          <TokenExpiration />
          {children}
        </Providers>
      </body>
    </html>
  );
}
