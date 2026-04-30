import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { generateRegisterMetadata } from '@/lib/seo/metadata';
import Register from '@/components/app/auth/Register';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  return generateRegisterMetadata(lang);
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <Register dictionary={dictionary} lang={lang} />;
}
