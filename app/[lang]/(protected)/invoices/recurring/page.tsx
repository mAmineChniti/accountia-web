import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import RecurringInvoicesContent from '@/components/Invoices/RecurringInvoicesContent';

export default async function RecurringInvoicesPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const params = await props.params;
  const dictionary = await getDictionary(params.lang);

  return (
    <RecurringInvoicesContent lang={params.lang} dictionary={dictionary} />
  );
}
