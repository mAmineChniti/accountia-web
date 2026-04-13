import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { BusinessMembers } from '@/components/Business/BusinessMembers';

export default async function MembersPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { businessId } = await params;
  return <BusinessMembers businessId={businessId} />;
}
