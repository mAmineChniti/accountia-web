'use server';

import { getToken, getUser } from './cookies';

export async function verifySession() {
  try {
    const tokenData = await getToken();
    const userData = await getUser();

    if (!tokenData || !userData) {
      return;
    }

    const ADMIN_ROLES = ['PLATFORM_ADMIN', 'PLATFORM_OWNER'];
    return {
      authenticated: true,
      isAdmin: ADMIN_ROLES.includes(userData.role ?? ''),
      user: userData,
    };
  } catch {
    return;
  }
}
