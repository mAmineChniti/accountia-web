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
  let businessName: string;

  try {
    const businessResponse = await BusinessService.getBusinessById(businessId);
    businessName = businessResponse.business.name;
  } catch (error) {
    console.error('Failed to load business assistant page', {
      error,
      businessId,
      lang,
    });

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {dictionary.pages.business.failedToLoadDetails}
        </div>
      </div>
    );
  }

  return (
    <BusinessAssistant
      businessId={businessId}
      businessName={businessName}
      dictionary={dictionary}
      lang={lang}
    />
  );
}
