import { ReceivedInvoices } from '@/components/BusinessInvoices/ReceivedInvoices';
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';

export default async function CompanyInvoicesPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <ReceivedInvoices
      lang={lang}
      dictionary={dictionary}
      businessId={businessId}
    />
  );
}
