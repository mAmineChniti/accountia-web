'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setTokens, setUser } from '@/actions/cookies';
import { AuthService } from '@/lib/requests';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/get-dictionary';
import { localizeErrorMessage } from '@/lib/error-localization';

export default function OAuthCallback({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasStartedRef = useRef(false);
  const [runtimeError, setRuntimeError] = useState<string | undefined>();

  const { oauthCode, parseError } = useMemo<{
    oauthCode: string | undefined;
    parseError: string | undefined;
  }>(() => {
    const errorMsg = dictionary.pages.oauthCallback.errorDescription;

    if (searchParams.get('oauthError')) {
      return { oauthCode: undefined, parseError: errorMsg };
    }

    // Backend callback returns a one-time oauthCode. Accept code as fallback.
    const code = searchParams.get('oauthCode') ?? searchParams.get('code');
    if (code) {
      return { oauthCode: code, parseError: undefined };
    }

    return { oauthCode: undefined, parseError: errorMsg };
  }, [searchParams, dictionary]);

  useEffect(() => {
    if (parseError || !oauthCode || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    const consumedCodeKey = `oauth-code-consumed:${oauthCode}`;

    if (globalThis.sessionStorage.getItem(consumedCodeKey) === '1') {
      router.replace(`/${lang}/login`);
      return;
    }

    // Mark the one-time code as consumed before any network exchange
    globalThis.sessionStorage.setItem(consumedCodeKey, '1');

    const finalizeOAuth = async () => {
      try {
        const authResult = await AuthService.exchangeGoogleOAuthCode({
          code: oauthCode,
        });

        if ('tempToken' in authResult) {
          const loginUrl = new URL(
            `/${lang}/login`,
            globalThis.location.origin
          );
          loginUrl.searchParams.set('tempToken', authResult.tempToken);
          loginUrl.searchParams.set('oauth2fa', '1');
          router.replace(loginUrl.pathname + loginUrl.search);
          return;
        }

        const verifiedUserResponse = await AuthService.fetchUserWithAccessToken(
          authResult.accessToken
        );
        const { user: verifiedUser } = verifiedUserResponse;
        const { profilePicture, ...userWithoutProfilePicture } = verifiedUser;

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
          token: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          expires_at:
            authResult.accessTokenExpiresAt ||
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          expires_at_ts: authResult.accessTokenExpiresAt
            ? new Date(authResult.accessTokenExpiresAt).getTime()
            : Date.now() + 24 * 60 * 60 * 1000,
          refresh_expires_at:
            authResult.refreshTokenExpiresAt ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          refresh_expires_at_ts: authResult.refreshTokenExpiresAt
            ? new Date(authResult.refreshTokenExpiresAt).getTime()
            : Date.now() + 7 * 24 * 60 * 60 * 1000,
        });

        await setUser({
          userId: userWithoutProfilePicture.id,
          username: userWithoutProfilePicture.username,
          email: userWithoutProfilePicture.email,
          firstName: userWithoutProfilePicture.firstName,
          lastName: userWithoutProfilePicture.lastName,
          phoneNumber: userWithoutProfilePicture.phoneNumber,
          birthdate: userWithoutProfilePicture.birthdate,
          role: userWithoutProfilePicture.role ?? 'CLIENT',
          loginTime: new Date().toISOString(),
        });

        globalThis.dispatchEvent(new CustomEvent('auth:changed'));

        const role = userWithoutProfilePicture.role ?? '';
        const redirectPath = ['PLATFORM_ADMIN', 'PLATFORM_OWNER'].includes(role)
          ? `/${lang}/dashboard/admin`
          : role === 'CLIENT'
            ? `/${lang}/invoices`
            : `/${lang}`;

        router.replace(redirectPath);
      } catch (error: unknown) {
        // Allow retrying the same callback URL only when exchange fails.
        globalThis.sessionStorage.removeItem(consumedCodeKey);
        setRuntimeError(
          localizeErrorMessage(
            error,
            dictionary,
            dictionary.pages.oauthCallback.errorDescription
          )
        );
      }
    };

    void finalizeOAuth();
  }, [parseError, oauthCode, lang, router, dictionary]);

  const error = parseError || runtimeError || undefined;

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
