import { formatDate, dateToISOString, isoToDate } from '@/lib/date-utils';

describe('date-utils', () => {
  describe('formatDate', () => {
    it('should return "-" if date is undefined', () => {
      expect(formatDate()).toBe('-');
      expect(formatDate()).toBe('-');
    });

    it('should format date correctly for default locale (en)', () => {
      const date = new Date('2024-05-05');
      // toLocaleDateString might vary by environment, but we can test if it returns a non-empty string
      const result = formatDate(date, 'en');
      expect(result).toContain('2024');
      expect(result).toContain('May');
    });

    it('should format date correctly for French locale', () => {
      const date = new Date('2024-05-05');
      const result = formatDate(date, 'fr');
      expect(result).toContain('mai');
    });

    it('should return "-" for invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('-');
    });
  });

  describe('dateToISOString', () => {
    it('should convert date to YYYY-MM-DD', () => {
      const date = new Date(2024, 4, 5); // May 5th 2024
      expect(dateToISOString(date)).toBe('2024-05-05');
    });

    it('should return empty string if date is undefined', () => {
      expect(dateToISOString()).toBe('');
    });
  });

  describe('isoToDate', () => {
    it('should convert valid ISO string to Date object', () => {
      const dateStr = '2024-05-05';
      const result = isoToDate(dateStr);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(4); // May
      expect(result?.getDate()).toBe(5);
    });

    it('should return undefined for invalid strings', () => {
      expect(isoToDate('invalid')).toBeUndefined();
      expect(isoToDate('')).toBeUndefined();
    });
  });
});
