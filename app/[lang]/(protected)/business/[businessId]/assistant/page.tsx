import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { BusinessAssistant } from '@/components/BusinessAssistant/BusinessAssistant';
import { BusinessService } from '@/lib/requests';

export default async function BusinessAssistantPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);
  const businessResponse = await BusinessService.getBusinessById(businessId);

  return (
    <BusinessAssistant
      businessId={businessId}
      businessName={businessResponse.business.name}
      dictionary={dictionary}
      lang={lang}
    />
  );
}
