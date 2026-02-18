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
import { setAuthCookies } from '@/lib/actions';
import { LoginSchema, type LoginInput } from '@/types/RequestSchemas';
import { toast } from 'sonner';

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

  const loginMutation = useMutation({
    mutationFn: AuthService.login,
    onSuccess: async (response) => {
      if ('accessToken' in response && 'user' in response) {
        // Use server-provided expiry information
        const now = Date.now();
        let expiresAtMs: number = 0;

        if (response.expiresAt || response.accessTokenExpiresIn) {
          // Parse server expiry (could be timestamp or relative time)
          if (response.expiresAt) {
            expiresAtMs = new Date(response.expiresAt).getTime();
          } else if (response.accessTokenExpiresIn) {
            // Parse relative time like "24h", "7d"
            const match =
              response.accessTokenExpiresIn?.match(/(\d+)([dhmwy])/);
            if (match) {
              const value = Number.parseInt(match?.[1] ?? '', 10);
              const unit = match?.[2];
              const multipliers = {
                h: 3_600_000,
                d: 86_400_000,
                w: 604_800_000,
                m: 2_629_746_000,
                y: 31_536_000_000,
              };
              expiresAtMs =
                now + value * multipliers[unit as keyof typeof multipliers];
            }
          }
        }

        const maxAge =
          expiresAtMs > 0
            ? Math.floor((expiresAtMs - now) / 1000)
            : 7 * 24 * 60 * 60;

        // Set cookies using server action
        await setAuthCookies({
          token: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt,
          expiresAtMs,
          userId: response.user.id,
          maxAge,
        });

        router.push(`/${lang}`);
      } else {
        // Handle unexpected response shape
        console.error('Invalid login response shape:', response);
        toast.error(dictionary.pages.login.unexpectedError);
      }
    },
    onError: (_err: unknown) => {
      // Error is displayed via inline alert, no toast needed
    },
  });

  const onSubmit = async (data: LoginInput) => {
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
                    className="mt-0.5 h-4 w-4 flex-shrink-0"
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
