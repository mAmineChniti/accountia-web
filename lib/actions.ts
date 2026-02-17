'use server';

import { setCookie } from 'cookies-next/server';

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

  // Set token cookie
  await setCookie(
    'token',
    JSON.stringify({
      token,
      refreshToken,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      expires_at_ts: expiresAtMs,
    }),
    {
      path: '/',
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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
      path: '/',
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    }
  );
}
