import { cn, isAdminRole } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('class1', true && 'class2', false && 'class3')).toBe(
        'class1 class2'
      );
    });

    it('should merge tailwind classes correctly', () => {
      // Testing tailwind-merge functionality via cn
      expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
    });
  });

  describe('isAdminRole', () => {
    it('should return true for admin roles', () => {
      expect(isAdminRole('PLATFORM_ADMIN')).toBe(true);
      expect(isAdminRole('PLATFORM_OWNER')).toBe(true);
    });

    it('should return false for other roles', () => {
      expect(isAdminRole('CLIENT')).toBe(false);
      expect(isAdminRole('BUSINESS_OWNER')).toBe(false);
      expect(isAdminRole()).toBe(false);
    });
  });
});
