import { type Locale, i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import Navbar from '@/components/reusable/navbar';
import { type ReactNode } from 'react';
import { Footer } from '@/components/reusable/footer';
import { cookies } from 'next/headers';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

function parseJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);

  // ✅ Lire les cookies côté serveur
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');

  let serverUser: { userId: string; isAdmin: boolean; role?: string } | undefined = undefined;

  if (tokenCookie) {
    try {
      const parsed = JSON.parse(tokenCookie.value);
      const payload = parseJwt(parsed.token);
      if (payload?.id) {
        serverUser = {
          userId: payload.id,
          isAdmin: !!payload.isAdmin,
          role: payload.role,
        };
      }
    } catch {}
  }

  return (
    <>
      <Navbar lang={locale} dictionary={dictionary} serverUser={serverUser} />
      {children}
      <Footer dictionary={dictionary} />
    </>
  );
}