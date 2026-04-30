import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { generateProfileMetadata } from '@/lib/seo/metadata';
import Profile from '@/components/app/profile/Profile';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  return generateProfileMetadata(lang);
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <Profile dictionary={dictionary} lang={lang} />;
}
