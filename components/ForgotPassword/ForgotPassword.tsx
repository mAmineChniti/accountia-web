'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/types/RequestSchemas';

export default function ForgotPassword({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const successCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSubmitted && successCardRef.current) {
      successCardRef.current.focus();
    }
  }, [isSubmitted]);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: AuthService.forgotPassword,
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success(dictionary.pages.forgotPassword.successMessage);
    },
    onError: (_err: unknown) => {
      // Always show success message for security (don't reveal if email exists)
      setIsSubmitted(true);
      toast.success(dictionary.pages.forgotPassword.successMessage);
    },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPasswordMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <main
        className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center py-8"
        role="main"
      >
        <Card
          ref={successCardRef}
          className="mx-4 w-full max-w-lg"
          tabIndex={-1}
        >
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              {dictionary.pages.forgotPassword.successTitle}
            </CardTitle>
            <CardDescription className="text-base">
              {dictionary.pages.forgotPassword.successDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                {dictionary.pages.forgotPassword.checkEmailMessage}
              </p>
              <Link
                href={`/${lang}/login`}
                className="text-primary focus:ring-primary inline-block hover:underline focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                {dictionary.pages.forgotPassword.backToLogin}
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main
      className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center py-8"
      role="main"
    >
      <Card className="mx-4 w-full max-w-lg" tabIndex={-1}>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold" tabIndex={-1}>
            {dictionary.pages.forgotPassword.title}
          </CardTitle>
          <CardDescription className="text-base" tabIndex={-1}>
            {dictionary.pages.forgotPassword.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">
                      {dictionary.pages.forgotPassword.emailLabel}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        placeholder={
                          dictionary.pages.forgotPassword.emailPlaceholder
                        }
                        aria-describedby="email-error"
                        aria-invalid={!!form.formState.errors.email}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage
                      id="email-error"
                      role="alert"
                      aria-live="polite"
                    />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending
                  ? dictionary.pages.forgotPassword.sendingButton
                  : dictionary.pages.forgotPassword.sendButton}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <Link
              href={`/${lang}/login`}
              className="text-muted-foreground hover:text-primary focus:ring-primary text-sm underline-offset-4 hover:underline focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              {dictionary.pages.forgotPassword.backToLogin}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
