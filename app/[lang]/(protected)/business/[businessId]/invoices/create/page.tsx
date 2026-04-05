import { CreateBusinessInvoicePage } from '@/components/BusinessInvoices/CreateBusinessInvoicePage';
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';

export default async function CreateInvoicePage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <CreateBusinessInvoicePage
      businessId={businessId}
      dictionary={dictionary}
      lang={lang}
    />
  );
}
