import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import Register from '@/components/Register/Register';

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <Register dictionary={dictionary} lang={lang} />;
}
