import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import ReportsTab from '@/components/Invoices/ReportsTab';

export default async function ReportsPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const params = await props.params;
  const dictionary = await getDictionary(params.lang);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <ReportsTab dictionary={dictionary} lang={params.lang} />
    </div>
  );
}
