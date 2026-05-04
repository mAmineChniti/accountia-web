import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { BusinessVendors } from '@/components/app/business-vendors/BusinessVendors';

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);

  return <BusinessVendors businessId={businessId} dictionary={dictionary} />;
}
