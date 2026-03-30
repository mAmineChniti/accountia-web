import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import ReportsClient from '@/components/Reports/ReportsClient';

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  
  return <ReportsClient dictionary={dictionary} lang={lang} />;
}
