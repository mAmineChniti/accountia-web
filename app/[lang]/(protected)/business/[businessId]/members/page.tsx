import { type Locale } from '@/i18n-config';
import { BusinessMembers } from '@/components/app/business-members/BusinessMembers';
import { getDictionary } from '@/get-dictionary';

export default async function MembersPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { businessId, lang } = await params;
  const dictionary = await getDictionary(lang);
  return <BusinessMembers businessId={businessId} dictionary={dictionary} />;
}
