import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { BusinessExpenses } from '@/components/Expenses/BusinessExpenses';

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);
  return <BusinessExpenses businessId={businessId} dictionary={dictionary} />;
}
