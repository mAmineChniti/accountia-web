import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import Profile from '@/components/Profile/Profile';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <Profile dictionary={dictionary} />;
}
