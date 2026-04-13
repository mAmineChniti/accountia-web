import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { BusinessAnalytics } from '@/components/Analytics/BusinessAnalytics';

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);
  return <BusinessAnalytics businessId={businessId} dictionary={dictionary} />;
}
