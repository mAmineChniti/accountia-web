import { type Metadata } from 'next';
import BusinessStatistics from '@/components/Business/BusinessStatistics';
import { type Locale } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';

interface StatisticsPageProps {
  params: Promise<{
    lang: Locale;
    businessId: string;
  }>;
}

export async function generateMetadata({
  params,
}: StatisticsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const dictionary = await getDictionary(resolvedParams.lang);
  const t = dictionary.pages.business;

  return {
    title: `${t.statistics} | Accountia`,
    description: t.statisticsDescription,
  };
}

export default async function StatisticsPage({ params }: StatisticsPageProps) {
  const resolvedParams = await params;
  const dictionary = await getDictionary(resolvedParams.lang);
  const t = dictionary.pages.business;
  const statsUi = t.statisticsUi;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t.statistics}</h2>
          <p className="text-muted-foreground">{t.statisticsDescription}</p>
        </div>
      </div>

      <BusinessStatistics
        businessId={resolvedParams.businessId}
        lang={resolvedParams.lang}
        text={statsUi}
        errorMessages={dictionary.errorMessages}
      />
    </div>
  );
}
