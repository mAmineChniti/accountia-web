import { CollectionsDashboard } from '@/components/app/collections/CollectionsDashboard';
import { type Locale } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <CollectionsDashboard businessId={businessId} dictionary={dictionary} />
  );
}
