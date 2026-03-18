'use server';

import { clearAuthCookies, getToken } from '@/actions/cookies';
import { AuthService } from '@/lib/requests';

export async function logout() {
  try {
    const tokenData = await getToken();

    if (tokenData?.refreshToken) {
      await AuthService.logout(tokenData.refreshToken);
    }
  } finally {
    await clearAuthCookies();
  }

  return { success: true };
}
