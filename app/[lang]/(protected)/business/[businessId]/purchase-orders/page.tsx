import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { BusinessPurchaseOrders } from '@/components/app/business-purchase-orders/BusinessPurchaseOrders';

export default async function PurchaseOrdersPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <BusinessPurchaseOrders businessId={businessId} dictionary={dictionary} />
  );
}
