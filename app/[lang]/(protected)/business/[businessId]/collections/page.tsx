import { CollectionsDashboard } from '@/components/app/collections/CollectionsDashboard';
import { type Locale } from '@/i18n-config';

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { businessId } = await params;

  return <CollectionsDashboard businessId={businessId} />;
}
