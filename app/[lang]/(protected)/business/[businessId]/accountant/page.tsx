import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import BusinessAccountant from '@/components/app/business-accountant/BusinessAccountant';

export default async function BusinessAccountantPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);
  return (
    <BusinessAccountant
      businessId={businessId}
      lang={lang}
      dictionary={dictionary}
    />
  );
}
