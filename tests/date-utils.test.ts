import { describe, expect, it } from 'vitest';

import {
  dateToISOString,
  formatDate,
  formatDateLong,
  getCalendarDirection,
  getCalendarLocale,
  isoToDate,
} from '@/lib/date-utils';

describe('date-utils', () => {
  it('returns fallback dash for undefined or invalid dates', () => {
    expect(formatDate()).toBe('-');
    expect(formatDate('not-a-date')).toBe('-');
    expect(formatDateLong()).toBe('-');
  });

  it('formats valid dates for supported locales', () => {
    const date = new Date('2026-05-06T12:00:00Z');

    const en = formatDate(date, 'en');
    const fr = formatDate(date, 'fr');
    const ar = formatDate(date, 'ar');

    expect(en).toContain('2026');
    expect(fr).toContain('2026');
    expect(ar).toContain('٢٠٢٦');
    expect(formatDateLong(date)).not.toBe('-');
  });

  it('returns calendar direction and locale by language', () => {
    expect(getCalendarDirection('ar')).toBe('rtl');
    expect(getCalendarDirection('en')).toBe('ltr');

    expect(getCalendarLocale('ar')).toBeDefined();
    expect(getCalendarLocale('fr')).toBeUndefined();
  });

  it('converts dates to and from ISO format safely', () => {
    const d = new Date('2026-01-09T08:00:00Z');
    expect(dateToISOString(d)).toBe('2026-01-09');
    expect(dateToISOString()).toBe('');

    const parsed = isoToDate('2026-01-09T08:00:00Z');
    expect(parsed).toBeInstanceOf(Date);
    expect(Number.isNaN(parsed?.getTime())).toBe(false);
    expect(isoToDate('')).toBeUndefined();
    expect(isoToDate('broken-date')).toBeUndefined();
  });
});
