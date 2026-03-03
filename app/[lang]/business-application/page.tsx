import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import BusinessApplication from '@/components/BusinessApplication/BusinessApplication';

export default async function BusinessApplicationPage({
    params,
}: {
    params: Promise<{ lang: Locale }>;
}) {
    const { lang } = await params;
    const dictionary = await getDictionary(lang);

    return <BusinessApplication dictionary={dictionary} lang={lang} />;
}
