import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { ClientPortal } from '@/components/app/portal/ClientPortal';

export default async function PortalPage({
  params,
}: {
  params: Promise<{ lang: Locale; token: string }>;
}) {
  const { lang, token } = await params;
  const dictionary = await getDictionary(lang);
  return <ClientPortal token={token} dictionary={dictionary} />;
}
