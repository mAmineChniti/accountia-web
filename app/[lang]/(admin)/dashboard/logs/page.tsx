import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import Logs from '@/components/Admin/Logs';

export default async function LogsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <Logs dictionary={dictionary} lang={lang} />;
}
