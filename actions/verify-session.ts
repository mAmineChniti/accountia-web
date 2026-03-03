'use server';

import { getToken, getUser } from './cookies';

export async function verifySession() {
  try {
    const tokenData = await getToken();
    const userData = await getUser();

    if (!tokenData || !userData) {
      return;
    }

    return {
      authenticated: true,
      isAdmin: userData.isAdmin,
      user: userData,
    };
  } catch {
    return;
  }
}
