import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { BusinessPurchaseOrders } from '@/components/PurchaseOrders/BusinessPurchaseOrders';
import { BusinessService } from '@/lib/services/business';

export default async function PurchaseOrdersPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const [dictionary, businessesData] = await Promise.all([
    getDictionary(lang),
    BusinessService.getMyBusinesses().catch(() => ({ businesses: [] })),
  ]);

  const myBusiness = businessesData.businesses.find((b) => b.id === businessId);
  const role = (myBusiness?.role ?? 'member').toUpperCase();
  const isOwner = role === 'OWNER';
  const canManage = role === 'OWNER' || role === 'ADMIN';

  return (
    <BusinessPurchaseOrders
      businessId={businessId}
      dictionary={dictionary}
      canManage={canManage}
      isOwner={isOwner}
    />
  );
}
