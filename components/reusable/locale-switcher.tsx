'use client';

import { Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { setLocale } from '@/actions/cookies';
import Link from 'next/link';
import { i18n, type Locale } from '@/i18n-config';

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

const handleLocaleChange = (newLocale: Locale) => {
  void setLocale(newLocale);
};

export default function LocaleSwitcher() {
  const pathname = usePathname();

  const redirectedPathname = (locale: Locale) => {
    if (!pathname) return '/';
    const segments = pathname.split('/');
    segments[1] = locale;
    return segments.join('/');
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
              asChild
              className={isActive ? 'bg-accent text-accent-foreground' : ''}
            >
              <Link
                href={redirectedPathname(locale)}
                className="flex items-center"
                onClick={() => handleLocaleChange(locale)}
                prefetch={true}
              >
                <span className="mr-2">{localeFlags[locale]}</span>
                <span>{localeNames[locale]}</span>
                {isActive && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    ✓
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
