import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import PlatformStatistics from '@/components/Admin/PlatformStatistics';

export default async function PlatformStatisticsPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const dictionary = await getDictionary(lang);

  return <PlatformStatistics dictionary={dictionary} lang={lang} />;
}
