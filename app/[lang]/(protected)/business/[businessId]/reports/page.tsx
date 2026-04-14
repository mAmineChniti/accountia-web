import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { VatReport } from '@/components/Reports/VatReport';

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);
  return <VatReport businessId={businessId} dictionary={dictionary} />;
}
