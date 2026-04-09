'use server';

import { cookies } from 'next/headers';
import type { AuthCookieData, UserCookieData } from '@/types/auth';

export async function setTokens(tokenData: AuthCookieData): Promise<void> {
  const maxAge = Math.max(
    tokenData.refresh_expires_at_ts > 0
      ? Math.floor((tokenData.refresh_expires_at_ts - Date.now()) / 1000)
      : 7 * 24 * 60 * 60,
    0
  );

  const cookieStore = await cookies();
  cookieStore.set('token', JSON.stringify(tokenData), {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
}

export async function setUser(userData: UserCookieData): Promise<void> {
  const maxAge = 7 * 24 * 60 * 60;

  const cookieStore = await cookies();
  cookieStore.set('user', JSON.stringify(userData), {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  cookieStore.delete('user');
}

export async function getToken(): Promise<AuthCookieData | undefined> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    if (!tokenCookie) {
      return undefined;
    }

    const tokenData = JSON.parse(tokenCookie.value) as AuthCookieData;

    let timestampMs = tokenData.expires_at_ts;
    if (timestampMs && timestampMs < 1e12) {
      timestampMs = timestampMs * 1000;
    }

    if (timestampMs && timestampMs <= Date.now()) {
      return undefined;
    }

    return tokenData;
  } catch {
    return undefined;
  }
}

export async function getTokenAllowExpired(): Promise<
  AuthCookieData | undefined
> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    if (!tokenCookie) {
      return undefined;
    }

    return JSON.parse(tokenCookie.value) as AuthCookieData;
  } catch {
    return undefined;
  }
}

export async function getUser(): Promise<UserCookieData | undefined> {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user');
    if (!userCookie) {
      return undefined;
    }

    const userData = JSON.parse(userCookie.value) as UserCookieData;
    return userData;
  } catch {
    return undefined;
  }
}

export async function getAuthStatus(): Promise<{ authenticated: boolean }> {
  try {
    const tokenData = await getToken();
    const userData = await getUser();

    if (!tokenData || !userData) {
      return { authenticated: false };
    }

    return { authenticated: true };
  } catch {
    return { authenticated: false };
  }
}

export async function setLocale(locale: string): Promise<void> {
  const maxAge = 60 * 60 * 24 * 365;

  const cookieStore = await cookies();
  cookieStore.set('preferred-locale', locale, {
    path: '/',
    maxAge,
    sameSite: 'lax',
  });
}
