import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { Suspense } from 'react';
import ForgotPasswordPage from '@/components/app/auth/ForgotPassword';
import ForgotPasswordSkeleton from '@/components/app/auth/ForgotPasswordSkeleton';

export default async function ForgotPassword({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<ForgotPasswordSkeleton />}>
      <ForgotPasswordPage dictionary={dictionary} lang={lang} />
    </Suspense>
  );
}
