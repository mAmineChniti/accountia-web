import { type ReactNode } from 'react';
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { requireAdmin } from '@/actions/session';
import UserSidebar from '@/components/reusable/user-sidebar';

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const session = await requireAdmin(`/${lang}/login`);
  const dictionary = await getDictionary(locale);

  return (
    <>
      <UserSidebar lang={locale} dictionary={dictionary} user={session.user} />
      <main className="ltr:ml-64 rtl:mr-64">{children}</main>
    </>
  );
}
