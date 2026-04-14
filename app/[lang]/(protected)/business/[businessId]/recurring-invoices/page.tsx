import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { RecurringInvoices } from '@/components/RecurringInvoices/RecurringInvoices';

export default async function RecurringInvoicesPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);
  return <RecurringInvoices businessId={businessId} dictionary={dictionary} />;
}
