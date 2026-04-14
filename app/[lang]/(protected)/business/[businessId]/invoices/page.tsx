import { IssuedInvoices } from '@/components/BusinessInvoices/IssuedInvoices';
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { requireAuth } from '@/actions/session';

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ lang: Locale; businessId: string }>;
}) {
  const { lang, businessId } = await params;
  const [dictionary, session] = await Promise.all([
    getDictionary(lang),
    requireAuth(`/${lang}/login`),
  ]);

  return (
    <IssuedInvoices
      lang={lang}
      dictionary={dictionary}
      businessId={businessId}
      currentUserId={session.user.userId}
    />
  );
}
