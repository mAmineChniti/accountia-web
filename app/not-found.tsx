import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Ghost } from 'lucide-react';
import Link from 'next/link';
import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { cookies } from 'next/headers';

async function getLocaleFromRequest(): Promise<Locale> {
  const cookieStore = await cookies();
  const preferredLocale = cookieStore.get('preferred-locale')?.value;

  if (preferredLocale && ['en', 'fr', 'ar'].includes(preferredLocale)) {
    return preferredLocale as Locale;
  }

  return 'en';
}

export default async function NotFound() {
  const lang = await getLocaleFromRequest();
  const dictionary = await getDictionary(lang);

  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <Card className="border-border bg-card relative z-20 w-full max-w-3xl rounded-2xl border-2 p-10 text-center shadow-xl">
        <div className="mb-2 flex flex-col items-center gap-6">
          <Ghost className="text-primary mb-4 h-16 w-16 animate-bounce" />
          <h1 className="text-foreground text-7xl font-bold tracking-widest opacity-80 drop-shadow-lg">
            404
          </h1>
        </div>
        <p className="text-foreground mb-2 text-xl font-medium opacity-70">
          {dictionary.common.pageNotFound}
        </p>
        <p className="text-muted-foreground mb-4 text-base">
          {dictionary.common.pageNotFoundDescription}
          <br />
          {dictionary.common.pageNotFoundHelp}
        </p>
        <Button
          asChild
          variant="default"
          size="lg"
          className="cursor-pointer px-8 py-2 text-base font-semibold"
        >
          <Link href={`/${lang}`} aria-label="Go back to home page">
            {dictionary.common.goHome}
          </Link>
        </Button>
      </Card>
    </div>
  );
}
