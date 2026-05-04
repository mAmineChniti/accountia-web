import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { BusinessClientPortal } from '@/components/app/business-client-portal/BusinessClientPortal';

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <BusinessClientPortal businessId={businessId} dictionary={dictionary} />
  );
}
