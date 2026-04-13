import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { BusinessVendors } from '@/components/Vendors/BusinessVendors';
import { BusinessService } from '@/lib/services/business';

export default async function VendorsPage({
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
  const role = myBusiness?.role ?? 'member';
  const canManage = role === 'owner' || role === 'OWNER' || role === 'admin' || role === 'ADMIN';

  return <BusinessVendors businessId={businessId} dictionary={dictionary} canManage={canManage} />;
}
