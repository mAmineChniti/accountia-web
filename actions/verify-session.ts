'use server';

import { getToken, getUser } from './cookies';
import { isAdminRole } from '@/lib/auth';

export async function verifySession() {
  try {
    const tokenData = await getToken();
    const userData = await getUser();

    if (!tokenData || !userData) {
      return;
    }

    return {
      authenticated: true,
      isAdmin: isAdminRole(userData.role),
      user: userData,
    };
  } catch {
    return;
  }
}
