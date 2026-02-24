import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import ProfileClient from '@/components/Profile/ProfileClient';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ProfileClient dictionary={dictionary} lang={lang} />;
}
