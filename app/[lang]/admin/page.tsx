import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import AdminUsersTable from '@/components/Admin/AdminUsersTable';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <AdminUsersTable dictionary={dictionary} />;
}
