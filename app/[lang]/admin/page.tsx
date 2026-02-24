import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  console.log('AdminPage dictionary:', dictionary);
  return (
    <main className="container mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="mt-4">
        Only users with administrative access should see this.
      </p>
    </main>
  );
}
