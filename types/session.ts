import type { UserCookieData } from '@/types/auth';

export interface AuthenticatedSession {
  authenticated: true;
  user: UserCookieData;
  isAdmin: boolean;
}
