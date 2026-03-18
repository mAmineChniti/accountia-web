'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { AuthService } from '@/lib/requests';
import { type SyntheticEvent, useState } from 'react';
import {
  LoginSchema,
  type LoginInput,
  TwoFALoginSchema,
  type TwoFALoginInput,
} from '@/types/RequestSchemas';
import { setTokens, setUser } from '@/actions/cookies';
import type { AuthResponseDto } from '@/types/ResponseInterfaces';
import { localizeErrorMessage } from '@/lib/error-localization';

export default function Login({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOAuthTempToken =
    searchParams.get('oauth2fa') === '1'
      ? searchParams.get('tempToken')
      : undefined;

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [twoFA, setTwoFA] = useState<
    | {
        tempToken: string;
        email: string;
      }
    | undefined
  >(() =>
    initialOAuthTempToken
      ? { tempToken: initialOAuthTempToken, email: '' }
      : undefined
  );
  const [otpCode, setOtpCode] = useState('');
  const twoFAForm = useForm<TwoFALoginInput>({
    resolver: zodResolver(TwoFALoginSchema),
    defaultValues: {
      tempToken: initialOAuthTempToken ?? '',
      code: '',
    },
  });

  const isTwoFACodeValid = otpCode.length === 6 && /^\d{6}$/.test(otpCode);

  const handleAuthSuccess = async (
    response:
      | AuthResponseDto
      | { tempToken: string; twoFactorRequired: boolean },
    email?: string
  ) => {
    if ('tempToken' in response) {
      setTwoFA({ tempToken: response.tempToken, email: email ?? '' });
      twoFAForm.reset({ tempToken: response.tempToken, code: '' });
      setOtpCode('');
      return;
    }

    const authResponse = response as AuthResponseDto;
    const { profilePicture, ...userWithoutProfilePicture } = authResponse.user;
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
      token: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
      expires_at:
        authResponse.accessTokenExpiresAt ||
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      expires_at_ts: authResponse.accessTokenExpiresAt
        ? new Date(authResponse.accessTokenExpiresAt).getTime()
        : Date.now() + 24 * 60 * 60 * 1000,
      refresh_expires_at:
        authResponse.refreshTokenExpiresAt ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      refresh_expires_at_ts: authResponse.refreshTokenExpiresAt
        ? new Date(authResponse.refreshTokenExpiresAt).getTime()
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

    if (
      ['PLATFORM_ADMIN', 'PLATFORM_OWNER'].includes(
        userWithoutProfilePicture.role ?? ''
      )
    ) {
      router.push(`/${lang}/dashboard/admin`);
    } else if (userWithoutProfilePicture.role === 'CLIENT') {
      router.push(`/${lang}/invoices`);
    } else {
      router.push(`/${lang}`);
    }
  };

  const loginMutation = useMutation<
    Awaited<ReturnType<typeof AuthService.login>>,
    unknown,
    LoginInput
  >({
    mutationFn: AuthService.login,
    onSuccess: async (response, variables) => {
      await handleAuthSuccess(response, variables.email);
    },
  });

  const twoFAMutation = useMutation<
    Awaited<ReturnType<typeof AuthService.twoFactorLogin>>,
    unknown,
    TwoFALoginInput
  >({
    mutationFn: AuthService.twoFactorLogin,
    onSuccess: async (response) => {
      await handleAuthSuccess(response);
    },
  });

  const onSubmit = async (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  const handleOtpSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    if (!twoFA || !isTwoFACodeValid) return;
    twoFAMutation.mutate({ tempToken: twoFA.tempToken, code: otpCode });
  };

  const handleGoogleLogin = () => {
    const url = AuthService.getGoogleAuthUrl({ lang, mode: 'login' });
    globalThis.location.assign(url);
  };

  const loginErrorMessage = loginMutation.error
    ? localizeErrorMessage(
        loginMutation.error,
        dictionary,
        dictionary.pages.login.unexpectedError
      )
    : undefined;

  const twoFAErrorMessage = twoFAMutation.error
    ? localizeErrorMessage(
        twoFAMutation.error,
        dictionary,
        dictionary.pages.login.unexpectedError
      )
    : undefined;

  return (
    <main
      className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center py-8"
      role="main"
    >
      <Card className="mx-4 w-full max-w-lg" tabIndex={-1}>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold" tabIndex={-1}>
            {dictionary.pages.login.title}
          </CardTitle>
          <CardDescription className="text-base" tabIndex={-1}>
            {dictionary.pages.login.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFA ? (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm leading-none font-medium">
                    {dictionary.pages.login.twoFactorLabel}
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(v) => setOtpCode(v)}
                      disabled={twoFAMutation.isPending}
                      autoFocus
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {twoFAErrorMessage && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                    id="2fa-error-msg"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-sm">{twoFAErrorMessage}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={twoFAMutation.isPending || !isTwoFACodeValid}
                >
                  {twoFAMutation.isPending
                    ? dictionary.pages.login.verifying2FAButton
                    : dictionary.pages.login.verify2FAButton}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Form {...form}>
                <fieldset className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="email">
                          {dictionary.pages.login.emailLabel}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="email"
                            type="email"
                            placeholder={
                              dictionary.pages.login.emailPlaceholder
                            }
                            aria-describedby="email-error"
                            aria-invalid={!!form.formState.errors.email}
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage id="email-error" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="password">
                          {dictionary.pages.login.passwordLabel}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder={
                              dictionary.pages.login.passwordPlaceholder
                            }
                            aria-describedby="password-error"
                            aria-invalid={!!form.formState.errors.password}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage id="password-error" />
                      </FormItem>
                    )}
                  />
                </fieldset>

                {loginErrorMessage && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                    id="login-error"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-sm">{loginErrorMessage}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  aria-describedby={
                    loginErrorMessage ? 'login-error' : undefined
                  }
                >
                  {loginMutation.isPending
                    ? dictionary.pages.login.signingInButton
                    : dictionary.pages.login.signInButton}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                >
                  {dictionary.pages.login.continueWithGoogle}
                </Button>
              </Form>
            </form>
          )}

          <Separator className="my-6" />

          <nav
            className="space-y-4 text-center"
            aria-label={dictionary.pages.login.authNavigationLabel}
          >
            <p>
              <Link
                href={`/${lang}/forgot-password`}
                className="text-muted-foreground hover:text-primary focus:ring-primary text-sm underline-offset-4 hover:underline focus:ring-2 focus:ring-offset-2 focus:outline-none"
                aria-label={dictionary.pages.login.resetPasswordAriaLabel}
              >
                {dictionary.pages.login.forgotPassword}
              </Link>
            </p>
            <p className="text-muted-foreground text-sm">
              {dictionary.pages.login.noAccount}{' '}
              <Link
                href={`/${lang}/register`}
                className="text-primary focus:ring-primary hover:underline focus:ring-2 focus:ring-offset-2 focus:outline-none"
                aria-label={dictionary.pages.login.createAccountAriaLabel}
              >
                {dictionary.pages.login.signUp}
              </Link>
            </p>
          </nav>
        </CardContent>
      </Card>
    </main>
  );
}
