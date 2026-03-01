'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { getDefaultRoute } from '@/lib/rbac';
import { useState } from 'react';
import {
  LoginSchema,
  type LoginInput,
  TwoFALoginSchema,
  type TwoFALoginInput,
} from '@/types/RequestSchemas';
import { toast } from 'sonner';
import { setCookie } from 'cookies-next/client';

export default function Login({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const router = useRouter();

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
  >();
  const twoFAForm = useForm<TwoFALoginInput>({
    resolver: zodResolver(TwoFALoginSchema),
    defaultValues: {
      tempToken: '',
      code: '',
    },
  });

  const isTwoFACodeValid = twoFAForm.formState.isValid;

  const loginMutation = useMutation<
    Awaited<ReturnType<typeof AuthService.login>>,
    unknown,
    LoginInput
  >({
    mutationFn: AuthService.login,
    onSuccess: async (response, variables) => {
      if ('accessToken' in response && 'user' in response) {
        const now = Date.now();
        let expiresAtMs: number = 0;
        if (response.accessTokenExpiresAt) {
          expiresAtMs = new Date(response.accessTokenExpiresAt).getTime();
        }
        const maxAge =
          expiresAtMs > 0
            ? Math.floor((expiresAtMs - now) / 1000)
            : 7 * 24 * 60 * 60;
        const { profilePicture, ...userWithoutProfilePicture } = response.user;
        if (profilePicture) {
          try {
            localStorage.setItem('profilePicture', profilePicture);
          } catch {}
        }
        setCookie(
          'token',
          JSON.stringify({
            token: response.accessToken,
            refreshToken: response.refreshToken,
            expires_at: response.accessTokenExpiresAt,
            expires_at_ts: expiresAtMs,
          }),
          {
            path: '/',
            maxAge,
            sameSite: 'lax',
          }
        );
        setCookie(
          'user',
          JSON.stringify({
            userId: userWithoutProfilePicture.id,
            isAdmin: userWithoutProfilePicture.isAdmin,
            loginTime: new Date().toISOString(),
          }),
          {
            path: '/',
            maxAge,
            sameSite: 'lax',
          }
        );

        // ✅ Redirection personnalisée avec userId
        const userId = userWithoutProfilePicture.id;
        const dest = response.user.role
          ? getDefaultRoute(response.user.role, lang, userId)
          : response.user.isAdmin ? `/${lang}/admin` : `/${lang}`;
        window.location.href = dest;
      } else if ('tempToken' in response && response.twoFactorRequired) {
        setTwoFA({ tempToken: response.tempToken, email: variables.email });
        twoFAForm.reset({ tempToken: response.tempToken, code: '' });
      } else {
        console.error('Invalid login response shape:', response);
        toast.error(dictionary.pages.login.unexpectedError);
      }
    },
  });

  const twoFAMutation = useMutation<
    Awaited<ReturnType<typeof AuthService.twoFactorLogin>>,
    unknown,
    TwoFALoginInput
  >({
    mutationFn: AuthService.twoFactorLogin,
    onSuccess: async (response) => {
      if ('accessToken' in response && 'user' in response) {
        const now = Date.now();
        let expiresAtMs: number = 0;
        if (response.accessTokenExpiresAt) {
          expiresAtMs = new Date(response.accessTokenExpiresAt).getTime();
        }
        const maxAge =
          expiresAtMs > 0
            ? Math.floor((expiresAtMs - now) / 1000)
            : 7 * 24 * 60 * 60;
        const { profilePicture, ...userWithoutProfilePicture } = response.user;
        if (profilePicture) {
          try {
            localStorage.setItem('profilePicture', profilePicture);
          } catch {}
        }
        setCookie(
          'token',
          JSON.stringify({
            token: response.accessToken,
            refreshToken: response.refreshToken,
            expires_at: response.accessTokenExpiresAt,
            expires_at_ts: expiresAtMs,
          }),
          {
            path: '/',
            maxAge,
            sameSite: 'lax',
          }
        );
        setCookie(
          'user',
          JSON.stringify({
            userId: userWithoutProfilePicture.id,
            isAdmin: userWithoutProfilePicture.isAdmin,
            loginTime: new Date().toISOString(),
          }),
          {
            path: '/',
            maxAge,
            sameSite: 'lax',
          }
        );

        // ✅ Redirection personnalisée avec userId
        const userId = userWithoutProfilePicture.id;
        const dest = response.user.role
          ? getDefaultRoute(response.user.role, lang, userId)
          : response.user.isAdmin ? `/${lang}/admin` : `/${lang}`;
        window.location.href = dest;
      } else {
        console.error('Invalid 2FA login response shape:', response);
        toast.error(dictionary.pages.login.unexpectedError);
      }
    },
  });

  const onSubmit = async (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  const on2FASubmit = async (data: TwoFALoginInput) => {
    twoFAMutation.mutate(data);
  };

  const loginErrorMessage =
    loginMutation.error instanceof Error
      ? loginMutation.error.message
      : typeof loginMutation.error === 'string'
        ? loginMutation.error
        : loginMutation.error
          ? dictionary.pages.login.unexpectedError
          : undefined;

  const twoFAErrorMessage =
    twoFAMutation.error instanceof Error
      ? twoFAMutation.error.message
      : typeof twoFAMutation.error === 'string'
        ? twoFAMutation.error
        : twoFAMutation.error
          ? dictionary.pages.login.unexpectedError
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
            <form
              onSubmit={twoFAForm.handleSubmit(on2FASubmit)}
              className="space-y-4"
            >
              <Form {...twoFAForm}>
                <fieldset className="space-y-4">
                  <FormField
                    control={twoFAForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="2fa-code">
                          {dictionary.pages.login.twoFactorLabel}
                        </FormLabel>
                        <FormControl>
                          <InputOTP
                            maxLength={6}
                            value={field.value}
                            onChange={field.onChange}
                            containerClassName="justify-center"
                            inputMode="numeric"
                            aria-describedby="2fa-error"
                            aria-invalid={!!twoFAForm.formState.errors.code}
                          >
                            <InputOTPGroup>
                              {[0, 1, 2, 3, 4, 5].map((i) => (
                                <InputOTPSlot key={i} index={i} />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage id="2fa-error" />
                      </FormItem>
                    )}
                  />
                </fieldset>

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
                  aria-describedby={
                    twoFAErrorMessage ? '2fa-error-msg' : undefined
                  }
                >
                  {twoFAMutation.isPending
                    ? dictionary.pages.login.verifying2FAButton
                    : dictionary.pages.login.verify2FAButton}
                </Button>
              </Form>
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