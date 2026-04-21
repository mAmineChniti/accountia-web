import { type ReactNode } from 'react';
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { requireAdmin } from '@/actions/session';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
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
  const isRTL = locale === 'ar';

  return (
    <SidebarProvider>
      <UserSidebar
        lang={locale}
        dictionary={dictionary}
        user={session.user}
        side={isRTL ? 'right' : 'left'}
      />
      <SidebarInset>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
