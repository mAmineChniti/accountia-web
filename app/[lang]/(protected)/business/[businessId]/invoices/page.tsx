import { IssuedInvoices } from '@/components/BusinessInvoices/IssuedInvoices';
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <IssuedInvoices
      lang={lang}
      dictionary={dictionary}
      businessId={businessId}
    />
  );
}
