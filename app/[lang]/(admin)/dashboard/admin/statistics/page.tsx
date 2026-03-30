import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import StatisticsClient from './statistics-client';

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <StatisticsClient dictionary={dictionary} lang={lang} />;
}
