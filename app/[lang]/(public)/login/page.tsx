import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { generateLoginMetadata } from '@/lib/seo/metadata';
import Login from '@/components/app/auth/Login';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  return generateLoginMetadata(lang);
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <Login dictionary={dictionary} lang={lang} />;
}
