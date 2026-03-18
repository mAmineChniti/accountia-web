import { getToken, getUser } from '@/actions/cookies';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/utils';
import type { AuthenticatedSession } from '@/types/session';

export type { AuthenticatedSession, Session } from '@/types/session';

export async function getSession(): Promise<AuthenticatedSession | undefined> {
  try {
    const [token, user] = await Promise.all([getToken(), getUser()]);

    if (!token || !user) {
      return undefined;
    }

    return {
      authenticated: true,
      user,
      isAdmin: isAdminRole(user.role),
    };
  } catch {
    return undefined;
  }
}

export async function requireAuth(
  redirectPath: string
): Promise<AuthenticatedSession> {
  const session = await getSession();

  if (!session) {
    redirect(redirectPath);
  }

  return session;
}

export async function requireAdmin(
  redirectPath: string
): Promise<AuthenticatedSession> {
  const session = await getSession();

  if (!session || !session.isAdmin) {
    redirect(redirectPath);
  }

  return session;
}
