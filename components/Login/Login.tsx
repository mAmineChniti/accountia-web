'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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
import { LoginSchema, type LoginInput } from '@/types/RequestSchemas';
import { toast } from 'sonner';
import { setCookie } from 'cookies-next/client';
import { useSocialAuth } from '@/hooks/useSocialAuth';

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

  const { loading, error: socialError, handleSocialLogin } = useSocialAuth(lang);

  const loginMutation = useMutation({
    mutationFn: AuthService.login,
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

        if (response.user.isAdmin) {
          router.push(`/${lang}/admin`);
        } else {
          router.push(`/${lang}`);
        }
      } else {
        console.error('Invalid login response shape:', response);
        toast.error(dictionary.pages.login.unexpectedError);
      }
    },
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  const loginErrorMessage =
    loginMutation.error instanceof Error
      ? loginMutation.error.message
      : typeof loginMutation.error === 'string'
        ? loginMutation.error
        : loginMutation.error
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
                          placeholder={dictionary.pages.login.emailPlaceholder}
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
                aria-describedby={loginErrorMessage ? 'login-error' : undefined}
              >
                {loginMutation.isPending
                  ? dictionary.pages.login.signingInButton
                  : dictionary.pages.login.signInButton}
              </Button>
            </Form>
          </form>

          <Separator className="my-6" />

          <div className="space-y-3">
            {socialError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm">{socialError}</span>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading === 'google'}
              onClick={() => handleSocialLogin('google')}
            >
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading === 'google'
                ? 'Signing in...'
                : (dictionary.pages.login.signInWithGoogle ?? 'Sign in with Google')}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading === 'github'}
              onClick={() => handleSocialLogin('github')}
            >
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              {loading === 'github'
                ? 'Signing in...'
                : (dictionary.pages.login.signInWithGitHub ?? 'Sign in with GitHub')}
            </Button>
          </div>

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