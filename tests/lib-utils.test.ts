import { describe, expect, it } from 'vitest';

import { cn, isAdminRole } from '@/lib/utils';

describe('cn', () => {
  it('merges conflicting tailwind classes', () => {
    expect(cn('p-4 p-6')).toBe('p-6');
  });
});

describe('isAdminRole', () => {
  it('detects admin roles', () => {
    expect(isAdminRole('PLATFORM_ADMIN')).toBe(true);
    expect(isAdminRole('PLATFORM_OWNER')).toBe(true);
    expect(isAdminRole('CLIENT')).toBe(false);
    expect(isAdminRole()).toBe(false);
  });
});
