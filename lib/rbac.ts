export enum Role {
  PLATFORM_OWNER = 'PLATFORM_OWNER',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  BUSINESS_ADMIN = 'BUSINESS_ADMIN',
  CLIENT = 'CLIENT',
}

const ROUTE_PERMISSIONS: Record<Role, string[]> = {
  [Role.PLATFORM_OWNER]: ['/admin'],
  [Role.PLATFORM_ADMIN]: ['/admin'],
  [Role.BUSINESS_OWNER]: ['/dashboard', '/clients', '/invoices', '/team'],
  [Role.BUSINESS_ADMIN]: ['/dashboard', '/clients', '/team'],
  [Role.CLIENT]: ['/invoices'],
};

export function hasPermission(role: Role, pathname: string): boolean {
  const allowed = ROUTE_PERMISSIONS[role] ?? [];
  return allowed.some((route) => pathname.startsWith(route));
}

export function getDefaultRoute(role: Role, lang: string): string {
  switch (role) {
    case Role.PLATFORM_OWNER:
    case Role.PLATFORM_ADMIN:
      return `/${lang}/admin`;      // ✅ ta page admin existante
    case Role.CLIENT:
      return `/${lang}/invoices`;
    default:
      return `/${lang}/dashboard`;  // BUSINESS_OWNER + BUSINESS_ADMIN
  }
}