import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import ResetPasswordPage from '@/components/ResetPassword/ResetPassword';

export default async function ResetPassword({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ResetPasswordPage dictionary={dictionary} lang={lang} />;
}
