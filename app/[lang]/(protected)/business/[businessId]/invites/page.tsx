import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { requireAuth } from '@/actions/session';
import BusinessInvites from '@/components/Business/BusinessInvites';

export default async function BusinessInvitesPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  await requireAuth(`/${lang}/login`);
  const dictionary = await getDictionary(lang);

  return <BusinessInvites businessId={businessId} dictionary={dictionary} />;
}
