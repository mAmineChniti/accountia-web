export type UserRole = 'admin' | 'user';

const ADMIN_ROLE: UserRole = 'admin';
const USER_ROLE: UserRole = 'user';

export type SessionUserCookie = {
  userId: string;
  role: UserRole;
  isAdmin: boolean;
  loginTime: string;
};

type SessionUserCookieLike = {
  userId?: unknown;
  id?: unknown;
  role?: unknown;
  isAdmin?: unknown;
  loginTime?: unknown;
  user?: {
    userId?: unknown;
    id?: unknown;
    role?: unknown;
    isAdmin?: unknown;
  };
};

export const normalizeRole = (
  role?: string | null,
  isAdmin?: boolean
): UserRole => {
  const roleValue = role?.trim().toLowerCase();

  if (
    roleValue === 'admin' ||
    roleValue === 'administrator' ||
    roleValue === 'superadmin'
  ) {
    return ADMIN_ROLE;
  }

  if (
    roleValue === 'user' ||
    roleValue === 'member' ||
    roleValue === 'client'
  ) {
    return USER_ROLE;
  }

  return isAdmin ? ADMIN_ROLE : USER_ROLE;
};

export const isRoleAllowed = (
  role: UserRole,
  allowedRoles: readonly UserRole[]
): boolean => allowedRoles.includes(role);

const toBoolean = (value: unknown): boolean => value === true;

const toStringOrUndefined = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

export const parseSessionUserCookie = (
  rawCookie: string | undefined
): SessionUserCookie | undefined => {
  if (!rawCookie) return undefined;

  let parsed: SessionUserCookieLike;
  try {
    parsed = JSON.parse(rawCookie) as SessionUserCookieLike;
  } catch {
    return undefined;
  }

  const nestedUser = parsed.user;
  const userId =
    toStringOrUndefined(parsed.userId) ??
    toStringOrUndefined(parsed.id) ??
    toStringOrUndefined(nestedUser?.userId) ??
    toStringOrUndefined(nestedUser?.id);

  if (!userId) return undefined;

  const role = normalizeRole(
    toStringOrUndefined(parsed.role) ?? toStringOrUndefined(nestedUser?.role),
    toBoolean(parsed.isAdmin) || toBoolean(nestedUser?.isAdmin)
  );

  return {
    userId,
    role,
    isAdmin: role === ADMIN_ROLE,
    loginTime:
      toStringOrUndefined(parsed.loginTime) ?? new Date().toISOString(),
  };
};

export const serializeSessionUserCookie = (payload: {
  userId: string;
  role?: string | null;
  isAdmin?: boolean;
  loginTime?: string;
}): string => {
  const role = normalizeRole(payload.role, payload.isAdmin);

  return JSON.stringify({
    userId: payload.userId,
    role,
    isAdmin: role === ADMIN_ROLE,
    loginTime: payload.loginTime ?? new Date().toISOString(),
  } satisfies SessionUserCookie);
};
