import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import Invoices from '@/components/Invoices/Invoices';
import { getUser } from '@/actions/cookies';

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const user = await getUser();

  return <Invoices dictionary={dictionary} lang={lang} userId={user?.userId} />;
}
