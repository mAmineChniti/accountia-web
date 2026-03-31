'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { i18n, type Locale } from '@/i18n-config';
import { setLocale } from '@/actions/cookies';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
};

const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  fr: '🇫🇷',
  ar: '🇸🇦',
};

const handleLocaleChange = async (newLocale: Locale) => {
  await setLocale(newLocale);
};

export default function LocaleSwitcher() {
  const [mounted] = useState<boolean>(() => typeof window !== 'undefined');
  const pathname = usePathname();
  const router = useRouter();

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="w-auto px-3">
        <Globe className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  const redirectedPathname = (locale: Locale) => {
    if (!pathname) return '/';
    const segments = pathname.split('/');
    segments[1] = locale;
    return segments.join('/');
  };

  const handleLocaleClick = async (locale: Locale, href: string) => {
    handleLocaleChange(locale).catch(() => {});
    router.push(href);
  };

  const getCurrentLocale = (): Locale => {
    const segments = pathname.split('/');
    const locale = segments[1] as Locale;
    return i18n.locales.includes(locale) ? locale : i18n.defaultLocale;
  };

  const currentLocale = getCurrentLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="w-auto px-3">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="ml-2 hidden text-sm font-medium sm:inline">
            {localeFlags[currentLocale]} {localeNames[currentLocale]}
          </span>
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {i18n.locales.map((locale) => {
          const isActive = locale === currentLocale;
          return (
            <DropdownMenuItem
              key={locale}
              className={isActive ? 'bg-accent text-accent-foreground' : ''}
              onClick={() =>
                handleLocaleClick(locale, redirectedPathname(locale))
              }
            >
              <div className="flex items-center">
                <span className="mr-2">{localeFlags[locale]}</span>
                <span>{localeNames[locale]}</span>
                {isActive && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    ✓
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
