import { CollectionsDashboard } from '@/components/Collections/CollectionsDashboard';
import { requireAuth } from '@/actions/session';
import { type Locale } from '@/i18n-config';

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  await requireAuth(`/${lang}/login`);

  return <CollectionsDashboard businessId={businessId} />;
}
