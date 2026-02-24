import { type Locale } from '@/i18n-config';
import DashboardContent from '@/components/dashboard-content';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;

  return (
    <main className="container mx-auto px-4 py-8">
      <DashboardContent lang={lang} />
    </main>
  );
}
