// Force recompile
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import TemplatesContent from '@/components/Invoices/TemplatesContent';

export default async function InvoiceTemplatesPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const params = await props.params;
  const dictionary = await getDictionary(params.lang);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <TemplatesContent dictionary={dictionary} lang={params.lang} />
    </div>
  );
}
