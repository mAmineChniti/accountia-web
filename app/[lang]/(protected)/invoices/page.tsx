import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { generateInvoicesMetadata } from '@/lib/seo/metadata';
import Invoices from '@/components/app/invoices/Invoices';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  return generateInvoicesMetadata(lang);
}

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <Invoices dictionary={dictionary} lang={lang} />;
}
