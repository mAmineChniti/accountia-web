import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { TeamList } from '@/components/BusinessTeam/TeamList';

interface TeamPageProps {
  params: Promise<{ lang: Locale; businessId: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { lang, businessId } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <TeamList businessId={businessId} lang={lang} dictionary={dictionary} />
    </div>
  );
}
