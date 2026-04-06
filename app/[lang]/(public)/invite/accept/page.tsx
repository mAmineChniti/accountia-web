import { AcceptInvite } from '@/components/AcceptInvite/AcceptInvite';
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';

interface DefaultParams {
  params: Promise<{ lang: Locale }>;
}

export default async function AcceptInvitePage(props: DefaultParams) {
  const params = await props.params;
  const dictionary = await getDictionary(params.lang);

  return <AcceptInvite lang={params.lang} dictionary={dictionary} />;
}
