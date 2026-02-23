'use server';

import { setCookie } from 'cookies-next/server';

export async function setAuthCookies(data: {
  token: string;
  refreshToken: string;
  expiresAt: string | undefined;
  expiresAtMs: number;
  user: {
    id: string;
  };
  maxAge: number;
}) {
  const { token, refreshToken, expiresAt, expiresAtMs, user, maxAge } = data;

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

  await setCookie(
    'user',
    JSON.stringify({
      userId: user.id,
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
