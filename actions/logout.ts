'use server';

import { getToken, clearAuthCookies } from './cookies';
import { AuthService } from '@/lib/requests';

export async function serverLogout() {
  try {
    const tokens = await getToken();

    if (tokens?.refreshToken) {
      await AuthService.logout(tokens.refreshToken);
    }

    await clearAuthCookies();

    return { success: true };
  } catch (error) {
    await clearAuthCookies();
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    };
  }
}
