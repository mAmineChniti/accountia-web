import { type Locale, i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { Footer } from '@/components/reusable/footer';
import { type ReactNode } from 'react';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
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
