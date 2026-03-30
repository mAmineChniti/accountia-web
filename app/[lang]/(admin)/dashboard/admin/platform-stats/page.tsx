import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import PlatformStatsClient from './platform-stats-client';

export default async function PlatformStatsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <PlatformStatsClient dictionary={dictionary} lang={lang} />;
}
