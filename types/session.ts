import type { UserCookieData } from '@/types/auth';

export interface AuthenticatedSession {
  authenticated: true;
  user: UserCookieData;
  isAdmin: boolean;
}

export interface UnauthenticatedSession {
  authenticated: false;
  isAdmin: false;
}

export type Session = AuthenticatedSession | UnauthenticatedSession;
