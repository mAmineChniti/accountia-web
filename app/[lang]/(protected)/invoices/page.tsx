import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import Invoices from '@/components/Invoices/Invoices';

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <Invoices dictionary={dictionary} lang={lang} />;
}
