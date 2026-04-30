import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { generateBusinessApplicationMetadata } from '@/lib/seo/metadata';
import BusinessApplication from '@/components/app/business-application/BusinessApplication';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  return generateBusinessApplicationMetadata(lang);
}

export default async function BusinessApplicationPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <BusinessApplication dictionary={dictionary} lang={lang} />;
}
