'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setTokens, setUser } from '@/actions/cookies';
import type { AuthResponseDto } from '@/types/ResponseInterfaces';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/get-dictionary';

export default function OAuthCallback({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only used for async errors (finalizeLogin failure); parse errors are derived below.
  const [asyncError, setAsyncError] = useState<string | undefined>();

  // Parse search params synchronously at render time so no setState is called
  // inside the effect body (avoids react-hooks/set-state-in-effect).
  const { parsedAuth, parseError } = useMemo<{
    parsedAuth: AuthResponseDto | undefined;
    parseError: string | undefined;
  }>(() => {
    const errorMsg = dictionary.pages.oauthCallback.errorDescription;

    if (searchParams.get('oauthError')) {
      return { parsedAuth: undefined, parseError: errorMsg };
    }

    // Primary path: backend encodes the full AuthResponseDto as base64 JSON
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        return {
          parsedAuth: JSON.parse(atob(dataParam)) as AuthResponseDto,
          parseError: undefined,
        };
      } catch {
        return { parsedAuth: undefined, parseError: errorMsg };
      }
    }

    // Fallback: backend passes tokens as individual query params
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const accessTokenExpiresAt = searchParams.get('accessTokenExpiresAt');
    const refreshTokenExpiresAt = searchParams.get('refreshTokenExpiresAt');
    const userParam = searchParams.get('user');

    if (!accessToken || !refreshToken) {
      return { parsedAuth: undefined, parseError: errorMsg };
    }

    let user: AuthResponseDto['user'] = { id: '', username: '', email: '' };
    if (userParam) {
      try {
        user = JSON.parse(
          userParam.startsWith('{') ? userParam : atob(userParam)
        ) as AuthResponseDto['user'];
      } catch {
        // keep empty user stub; session will still be created with tokens
      }
    }

    return {
      parsedAuth: {
        accessToken,
        refreshToken,
        accessTokenExpiresAt:
          accessTokenExpiresAt ??
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        refreshTokenExpiresAt:
          refreshTokenExpiresAt ??
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        user,
      },
      parseError: undefined,
    };
  }, [searchParams, dictionary]);

  useEffect(() => {
    if (!parsedAuth) return;

    const finalizeLogin = async (res: AuthResponseDto) => {
      const { profilePicture, ...userWithoutPfp } = res.user;

      if (profilePicture) {
        try {
          localStorage.setItem('profilePicture', profilePicture);
        } catch {}
      } else {
        try {
          localStorage.removeItem('profilePicture');
        } catch {}
      }

      await setTokens({
        token: res.accessToken,
        refreshToken: res.refreshToken,
        expires_at: res.accessTokenExpiresAt,
        expires_at_ts: new Date(res.accessTokenExpiresAt).getTime(),
        refresh_expires_at: res.refreshTokenExpiresAt,
        refresh_expires_at_ts: new Date(res.refreshTokenExpiresAt).getTime(),
      });

      await setUser({
        userId: userWithoutPfp.id,
        username: userWithoutPfp.username,
        email: userWithoutPfp.email,
        firstName: userWithoutPfp.firstName,
        lastName: userWithoutPfp.lastName,
        phoneNumber: userWithoutPfp.phoneNumber,
        birthdate: userWithoutPfp.birthdate,
        role: userWithoutPfp.role ?? 'CLIENT',
        loginTime: new Date().toISOString(),
      });

      globalThis.dispatchEvent(new Event('auth:changed'));

      const role = userWithoutPfp.role ?? '';
      if (['PLATFORM_ADMIN', 'PLATFORM_OWNER'].includes(role)) {
        router.replace(`/${lang}/dashboard/admin`);
      } else if (role === 'CLIENT') {
        router.replace(`/${lang}/invoices`);
      } else {
        router.replace(`/${lang}`);
      }
    };

    finalizeLogin(parsedAuth).catch(() => {
      setAsyncError(dictionary.pages.oauthCallback.errorDescription);
    });
  }, [parsedAuth, lang, router, dictionary]);

  const error = parseError ?? asyncError;

  if (error) {
    return (
      <main className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center px-4">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">
            {dictionary.pages.oauthCallback.errorTitle}
          </h1>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild variant="outline">
            <a href={`/${lang}/login`}>
              {dictionary.pages.oauthCallback.backToLogin}
            </a>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">
          {dictionary.pages.oauthCallback.loading}
        </p>
      </div>
    </main>
  );
}
