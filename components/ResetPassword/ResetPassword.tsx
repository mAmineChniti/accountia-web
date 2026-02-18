'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  ResetPasswordSchema,
  type ResetPasswordInput,
} from '@/types/RequestSchemas';
import ResetPasswordSkeleton from './ResetPasswordSkeleton';

export default function ResetPasswordPage({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordContent dictionary={dictionary} lang={lang} />
    </Suspense>
  );
}

function ResetPasswordContent({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenFromUrl = searchParams.get('token');
  const token = tokenFromUrl || '';

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token: '',
      newPassword: '',
    },
  });

  useEffect(() => {
    if (token) {
      form.setValue('token', token);
    }
  }, [token, form]);

  const resetPasswordMutation = useMutation({
    mutationFn: AuthService.resetPassword,
    onSuccess: () => {
      toast.success(dictionary.pages.resetPassword.successMessage);
      router.push(`/${lang}/login`);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : dictionary.pages.resetPassword.errorMessage;
      toast.error(message);
    },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(data);
  };

  return (
    <main
      className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center py-8"
      role="main"
    >
      <Card className="mx-4 w-full max-w-lg" tabIndex={-1}>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold" tabIndex={-1}>
            {dictionary.pages.resetPassword.title}
          </CardTitle>
          <CardDescription className="text-base" tabIndex={-1}>
            {dictionary.pages.resetPassword.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {token && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {dictionary.pages.resetPassword.tokenDetected}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!token && (
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="token">
                        {dictionary.pages.resetPassword.tokenLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="token"
                          type="text"
                          placeholder={
                            dictionary.pages.resetPassword.tokenPlaceholder
                          }
                          aria-describedby="token-error"
                          aria-invalid={!!form.formState.errors.token}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        id="token-error"
                        role="alert"
                        aria-live="polite"
                      />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="newPassword">
                      {dictionary.pages.resetPassword.passwordLabel}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder={
                          dictionary.pages.resetPassword.passwordPlaceholder
                        }
                        aria-describedby="newPassword-error"
                        aria-invalid={!!form.formState.errors.newPassword}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage
                      id="newPassword-error"
                      role="alert"
                      aria-live="polite"
                    />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending
                  ? dictionary.pages.resetPassword.resettingButton
                  : dictionary.pages.resetPassword.resetButton}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <Link
              href={`/${lang}/login`}
              className="text-muted-foreground hover:text-primary focus:ring-primary text-sm underline-offset-4 hover:underline focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              {dictionary.pages.resetPassword.backToLogin}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
