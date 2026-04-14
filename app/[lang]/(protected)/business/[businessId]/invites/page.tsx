import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import BusinessInvites from '@/components/Business/BusinessInvites';

export default async function BusinessInvitesPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);

  return <BusinessInvites businessId={businessId} dictionary={dictionary} />;
}
