import { Suspense } from 'react';
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import OAuthCallback from '@/components/OAuthCallback/OAuthCallback';

export default async function OAuthCallbackPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense>
      <OAuthCallback lang={lang} dictionary={dictionary} />
    </Suspense>
  );
}
