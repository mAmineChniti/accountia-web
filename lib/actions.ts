'use server';

import { getCookie, setCookie, deleteCookie } from 'cookies-next/server';

export interface SetAuthCookiesData {
  token: string;
  refreshToken: string;
  expiresAt: string | undefined;
  expiresAtMs: number;
  userId: string;
  maxAge: number;
}

export async function setAuthCookies(data: SetAuthCookiesData) {
  const { token, refreshToken, expiresAt, expiresAtMs, userId, maxAge } = data;

  // Set token cookie using cookies-next
  await setCookie(
    'token',
    JSON.stringify({
      token,
      refreshToken,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      expires_at_ts: expiresAtMs,
    }),
    {
      maxAge,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    }
  );

  // Set user cookie with only session ID
  await setCookie(
    'user',
    JSON.stringify({
      sessionId: userId,
      loginTime: new Date().toISOString(),
    }),
    {
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    }
  );
}

export async function isUserAuthenticated(): Promise<boolean> {
  const tokenCookie = await getCookie('token');
  return !!tokenCookie;
}

export async function logoutUser(): Promise<void> {
  await deleteCookie('token');
  await deleteCookie('user');
}
