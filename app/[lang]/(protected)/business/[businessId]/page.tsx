import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { Business } from '@/components/Business/Business';

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);
  return (
    <Business businessId={businessId} dictionary={dictionary} lang={lang} />
  );
}
