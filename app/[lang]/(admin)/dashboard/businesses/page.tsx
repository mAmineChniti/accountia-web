import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import BusinessManagement from '@/components/app/dashboard/BusinessManagement';

export default async function BusinessManagementPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <BusinessManagement dictionary={dictionary} />;
}
