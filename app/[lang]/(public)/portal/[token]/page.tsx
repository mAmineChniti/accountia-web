import { type Locale } from '@/i18n-config';
import { ClientPortal } from '@/components/ClientPortal/ClientPortal';

export default async function PortalPage({
  params,
}: {
  params: Promise<{ lang: Locale; token: string }>;
}) {
  const { token } = await params;
  return <ClientPortal token={token} />;
}
