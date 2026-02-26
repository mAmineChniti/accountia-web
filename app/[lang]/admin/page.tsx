import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import Admin from '@/components/Admin/Admin';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <Admin dictionary={dictionary} lang={lang} />;
}
