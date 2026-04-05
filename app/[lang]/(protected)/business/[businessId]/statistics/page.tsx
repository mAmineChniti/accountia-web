import BusinessStatistics from '@/components/Business/BusinessStatistics';
import { type Locale } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <BusinessStatistics
      key={businessId}
      businessId={businessId}
      dictionary={dictionary}
      lang={lang}
    />
  );
}
