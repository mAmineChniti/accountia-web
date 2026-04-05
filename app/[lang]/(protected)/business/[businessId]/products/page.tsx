import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { BusinessProducts } from '@/components/Business/BusinessProducts';

export default async function BusinessProductsPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);
  return <BusinessProducts businessId={businessId} dictionary={dictionary} />;
}
