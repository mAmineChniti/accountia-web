import { type ReactNode } from 'react';
import { headers } from 'next/headers';
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { getSession } from '@/actions/session';
import Navbar from '@/components/reusable/navbar';

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;

  // Portal routes are standalone — no navbar or shared chrome
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const isPortal = /\/portal\//.test(pathname);

  if (isPortal) {
    return <>{children}</>;
  }

  const [dictionary, session] = await Promise.all([
    getDictionary(locale),
    getSession(),
  ]);

  return (
    <>
      <Navbar lang={locale} dictionary={dictionary} session={session} />
      <main>{children}</main>
    </>
  );
}
