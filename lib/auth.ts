export const ADMIN_ROLES = ['PLATFORM_ADMIN', 'PLATFORM_OWNER'] as const;

export function isAdminRole(role?: string): boolean {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}
