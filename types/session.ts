import type { UserCookieData } from './auth';

export interface AuthenticatedSession {
  authenticated: true;
  user: UserCookieData;
  isAdmin: boolean;
}
