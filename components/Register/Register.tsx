'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { AuthService, ApiError } from '@/lib/requests';
import { RegisterSchema, type RegisterInput } from '@/types/RequestSchemas';

const makeRegisterFormSchema = (messages: {
  confirmPasswordRequired: string;
  passwordsNotMatch: string;
  acceptTermsRequired: string;
}) =>
  RegisterSchema.extend({
    confirmPassword: z.string().min(1, messages.confirmPasswordRequired),
  })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordsNotMatch,
      path: ['confirmPassword'],
    })
    .refine((data) => data.acceptTerms === true, {
      message: messages.acceptTermsRequired,
      path: ['acceptTerms'],
    });

type RegisterFormInput = RegisterInput & {
  confirmPassword: string;
};

export default function Register({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const router = useRouter();
  const [showEmailNotConfirmedDialog, setShowEmailNotConfirmedDialog] =
    useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(
      makeRegisterFormSchema({
        confirmPasswordRequired:
          dictionary.pages.register.errors.confirmPasswordRequired,
        passwordsNotMatch: dictionary.pages.register.errors.passwordsNotMatch,
        acceptTermsRequired:
          dictionary.pages.register.errors.acceptTermsRequired,
      })
    ),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      birthdate: '',
      acceptTerms: false,
    },
    mode: 'onChange',
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => AuthService.register(data),
    onSuccess: (response) => {
      setUnconfirmedEmail(response.email);
      setShowEmailNotConfirmedDialog(true);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        switch (error.type) {
          case 'EMAIL_ALREADY_REGISTERED':
          case 'ACCOUNT_EXISTS': {
            router.push(`/${lang}/login`);

            break;
          }
          case 'EMAIL_NOT_CONFIRMED': {
            setUnconfirmedEmail(error.email || '');
            setShowEmailNotConfirmedDialog(true);

            break;
          }
          case 'EMAIL_ALREADY_REGISTERED': {
            toast.error(dictionary.pages.register.emailAlreadyRegistered);

            break;
          }
          default: {
            toast.error(dictionary.pages.register.registrationFailed);
          }
        }
      } else {
        toast.error(dictionary.pages.register.registrationFailed);
      }
    },
  });

  const onSubmit = (data: RegisterFormInput) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  const handleResendConfirmation = async () => {
    setIsResending(true);
    try {
      await AuthService.resendConfirmationEmail({ email: unconfirmedEmail });
      setShowEmailNotConfirmedDialog(false);
      toast.success(dictionary.pages.register.resendSuccessMessage);
    } catch {
      toast.error(dictionary.pages.register.resendErrorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center py-8">
      <Card className="mx-4 w-full max-w-lg" tabIndex={-1}>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold" tabIndex={-1}>
            {dictionary.pages.register.title}
          </CardTitle>
          <CardDescription className="text-base" tabIndex={-1}>
            {dictionary.pages.register.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <fieldset
                className="grid grid-cols-2 gap-4"
                aria-label={dictionary.pages.register.personalInfoLabel}
              >
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel htmlFor="firstName">
                        {dictionary.pages.register.firstNameLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder={
                            dictionary.pages.register.firstNamePlaceholder
                          }
                          aria-describedby="firstName-error"
                          aria-invalid={!!form.formState.errors.firstName}
                          autoComplete="given-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        id="firstName-error"
                        role="alert"
                        aria-live="polite"
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel htmlFor="lastName">
                        {dictionary.pages.register.lastNameLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder={
                            dictionary.pages.register.lastNamePlaceholder
                          }
                          aria-describedby="lastName-error"
                          aria-invalid={!!form.formState.errors.lastName}
                          autoComplete="family-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        id="lastName-error"
                        role="alert"
                        aria-live="polite"
                      />
                    </FormItem>
                  )}
                />
              </fieldset>

              <fieldset
                aria-label={dictionary.pages.register.accountInfoLabel}
                className="mt-6 space-y-4"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel htmlFor="username">
                        {dictionary.pages.register.usernameLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="username"
                          type="text"
                          placeholder={
                            dictionary.pages.register.usernamePlaceholder
                          }
                          aria-describedby="username-error"
                          aria-invalid={!!form.formState.errors.username}
                          autoComplete="username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        id="username-error"
                        role="alert"
                        aria-live="polite"
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel htmlFor="email">
                        {dictionary.pages.register.emailLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder={
                            dictionary.pages.register.emailPlaceholder
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

                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel htmlFor="birthdate">
                        {dictionary.pages.register.birthdateLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="birthdate"
                          type="date"
                          aria-describedby="birthdate-error"
                          aria-invalid={!!form.formState.errors.birthdate}
                          autoComplete="bday"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        id="birthdate-error"
                        role="alert"
                        aria-live="polite"
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel htmlFor="password">
                        {dictionary.pages.register.passwordLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="password"
                          type="password"
                          placeholder={
                            dictionary.pages.register.passwordPlaceholder
                          }
                          aria-describedby="password-error"
                          aria-invalid={!!form.formState.errors.password}
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        id="password-error"
                        role="alert"
                        aria-live="polite"
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel htmlFor="confirmPassword">
                        {dictionary.pages.register.confirmPasswordLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder={
                            dictionary.pages.register.confirmPasswordPlaceholder
                          }
                          aria-describedby="confirmPassword-error"
                          aria-invalid={!!form.formState.errors.confirmPassword}
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        id="confirmPassword-error"
                        role="alert"
                        aria-live="polite"
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          id="acceptTerms"
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            if (typeof checked === 'boolean') {
                              field.onChange(checked);
                            }
                          }}
                          aria-describedby="acceptTerms-error"
                          aria-invalid={!!form.formState.errors.acceptTerms}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel
                          htmlFor="acceptTerms"
                          className="cursor-pointer text-sm font-normal"
                        >
                          {dictionary.pages.register.termsAndConditions}
                        </FormLabel>
                      </div>
                      <FormMessage
                        id="acceptTerms-error"
                        role="alert"
                        aria-live="polite"
                      />
                    </FormItem>
                  )}
                />
              </fieldset>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  registerMutation.isPending || !form.watch('acceptTerms')
                }
                aria-describedby="acceptTerms-error"
              >
                {registerMutation.isPending
                  ? dictionary.pages.register.creatingAccountButton
                  : dictionary.pages.register.registerButton}
              </Button>
            </form>
          </Form>

          <Separator className="my-6" />

          <nav
            className="text-center"
            aria-label={dictionary.pages.register.authNavLabel}
          >
            <p className="text-muted-foreground text-sm">
              {dictionary.pages.register.hasAccount}{' '}
              <Link
                href={`/${lang}/login`}
                className="text-primary focus:ring-primary hover:underline focus:ring-2 focus:ring-offset-2 focus:outline-none"
                aria-label={dictionary.pages.register.signIn}
              >
                {dictionary.pages.register.signIn}
              </Link>
            </p>
          </nav>
        </CardContent>
      </Card>

      <Dialog
        open={showEmailNotConfirmedDialog}
        onOpenChange={setShowEmailNotConfirmedDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dictionary.pages.register.dialog.emailNotConfirmedTitle}
            </DialogTitle>
            <DialogDescription>
              {dictionary.pages.register.dialog.emailNotConfirmedDescription.replace(
                '{email}',
                unconfirmedEmail
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowEmailNotConfirmedDialog(false)}
            >
              {dictionary.pages.register.dialog.cancelButton}
            </Button>
            <Button onClick={handleResendConfirmation} disabled={isResending}>
              {isResending
                ? dictionary.pages.register.dialog.resendingButton
                : dictionary.pages.register.dialog.resendConfirmationButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
