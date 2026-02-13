import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import Login from '@/components/Login/Login';

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <Login dictionary={dictionary} lang={lang} />;
}
