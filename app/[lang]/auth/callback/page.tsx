import OAuthCallbackClient from '@/components/Auth/OAuthCallbackClient';
import type { Locale } from '@/i18n-config';

export default async function OAuthCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <OAuthCallbackClient lang={lang} searchParams={resolvedSearchParams} />
  );
}
