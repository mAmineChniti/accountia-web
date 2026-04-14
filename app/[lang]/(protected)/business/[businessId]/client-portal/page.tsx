import { type Locale } from '@/i18n-config';
import { BusinessClientPortal } from '@/components/ClientPortal/BusinessClientPortal';
import { BusinessService } from '@/lib/services/business';

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { businessId } = await params;
  const businessesData = await BusinessService.getMyBusinesses().catch(() => ({ businesses: [] }));
  const myBusiness = businessesData.businesses.find((b) => b.id === businessId);
  const role = (myBusiness?.role ?? 'member').toUpperCase();
  const canManage = role === 'OWNER' || role === 'ADMIN';

  return <BusinessClientPortal businessId={businessId} canManage={canManage} />;
}
