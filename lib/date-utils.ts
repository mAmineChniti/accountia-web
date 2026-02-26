import { format } from 'date-fns';
import { arSA } from 'react-day-picker/locale';
import { type Locale } from '@/i18n-config';

export function formatDate(
  date: Date | string | null | undefined,
  lang: Locale = 'en'
): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(dateObj.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return dateObj.toLocaleDateString(
    lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US',
    options
  );
}

export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(dateObj.getTime())) return '-';

  return format(dateObj, 'PPP');
}

export function getCalendarLocale(lang: Locale) {
  return lang === 'ar' ? arSA : undefined;
}

export function getCalendarDirection(lang: Locale): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export function dateToISOString(date: Date | null | undefined): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isoToDate(
  dateString: string | null | undefined
): Date | undefined {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
