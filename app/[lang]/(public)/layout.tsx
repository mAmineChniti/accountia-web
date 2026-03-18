import { type ReactNode } from 'react';
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
