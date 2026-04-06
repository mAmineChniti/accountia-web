'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  AcceptInviteSchema,
  type AcceptInviteInput,
} from '@/types/RequestSchemas';
import { ApiError, AuthService } from '@/lib/requests';
import { localizeErrorMessage } from '@/lib/error-localization';
import type { Dictionary } from '@/get-dictionary';
import type { Locale } from '@/i18n-config';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AcceptInvite({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const t = {
    title: 'Join the Team',
    description: 'Set up your account to accept the business invitation.',
    firstName: 'First Name',
    lastName: 'Last Name',
    password: 'Create Password',
    confirmPassword: 'Confirm Password',
    acceptButton: 'Accept Invitation',
    successMsg: 'Invitation accepted! You can now log in.',
    missingToken:
      'Invalid or missing invitation token. Please check your email link.',
    alreadyAccepted:
      'Invitation already accepted. Please log in with the invited email.',
    failedAccept: 'Failed to accept invitation',
    invalidLinkTitle: 'Invalid Link',
    goToLogin: 'Go to Login',
    loadingTitle: 'Loading invitation...',
    loadingDescription: 'Please wait while we verify your invitation link.',
    alreadyAcceptedTitle: 'Invitation Already Accepted',
    inactiveTitle: 'Invitation Not Active',
    alreadyAcceptedDescription:
      'This invitation has already been accepted. Please sign in with the invited email below.',
    inactiveDescription:
      'This invitation is no longer active. Please request a new invitation from the Business Owner.',
    invitedEmail: 'Invited Email',
    firstNamePlaceholder: 'John',
    lastNamePlaceholder: 'Doe',
    passwordPlaceholder: '••••••••',
  };

  const localized = dictionary.pages.acceptInvite;
  const text = {
    title: localized?.title || t.title,
    description: localized?.description || t.description,
    firstName: localized?.firstName || t.firstName,
    lastName: localized?.lastName || t.lastName,
    password: localized?.password || t.password,
    confirmPassword: localized?.confirmPassword || t.confirmPassword,
    acceptButton: localized?.acceptButton || t.acceptButton,
    successMsg: localized?.successMsg || t.successMsg,
    missingToken: localized?.missingToken || t.missingToken,
    alreadyAccepted: localized?.alreadyAccepted || t.alreadyAccepted,
    failedAccept: localized?.failedAccept || t.failedAccept,
    invalidLinkTitle: localized?.invalidLinkTitle || t.invalidLinkTitle,
    goToLogin: localized?.goToLogin || t.goToLogin,
    loadingTitle: localized?.loadingTitle || t.loadingTitle,
    loadingDescription: localized?.loadingDescription || t.loadingDescription,
    alreadyAcceptedTitle:
      localized?.alreadyAcceptedTitle || t.alreadyAcceptedTitle,
    inactiveTitle: localized?.inactiveTitle || t.inactiveTitle,
    alreadyAcceptedDescription:
      localized?.alreadyAcceptedDescription || t.alreadyAcceptedDescription,
    inactiveDescription:
      localized?.inactiveDescription || t.inactiveDescription,
    invitedEmail: localized?.invitedEmail || t.invitedEmail,
    firstNamePlaceholder:
      localized?.firstNamePlaceholder || t.firstNamePlaceholder,
    lastNamePlaceholder:
      localized?.lastNamePlaceholder || t.lastNamePlaceholder,
    passwordPlaceholder:
      localized?.passwordPlaceholder || t.passwordPlaceholder,
  };

  const form = useForm<AcceptInviteInput>({
    resolver: zodResolver(AcceptInviteSchema),
    defaultValues: {
      token,
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    form.setValue('token', token, { shouldValidate: true });
  }, [form, token]);

  const {
    data: invitePreview,
    isLoading: isInvitePreviewLoading,
    isError: isInvitePreviewError,
  } = useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => AuthService.getInvitePreview(token),
    enabled: !!token,
    retry: false,
  });

  const { mutate: acceptInvite, isPending } = useMutation({
    mutationFn: (data: AcceptInviteInput) => AuthService.acceptInvite(data),
    onSuccess: (response) => {
      toast.success(text.successMsg);
      const invitedEmail = response.email?.trim();
      if (invitedEmail) {
        router.push(`/${lang}/login?email=${encodeURIComponent(invitedEmail)}`);
        return;
      }
      router.push(`/${lang}/login`);
    },
    onError: (error: unknown) => {
      if (
        error instanceof ApiError &&
        error.type === 'INVITE_ALREADY_ACCEPTED'
      ) {
        const invitedEmail = error.email?.trim();
        toast.info(text.alreadyAccepted);
        if (invitedEmail) {
          router.push(
            `/${lang}/login?email=${encodeURIComponent(invitedEmail)}`
          );
          return;
        }
        router.push(`/${lang}/login`);
        return;
      }

      const errorMessage = localizeErrorMessage(
        error,
        dictionary,
        text.failedAccept
      );
      toast.error(errorMessage);
    },
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive text-xl">
              {text.invalidLinkTitle}
            </CardTitle>
            <CardDescription>{text.missingToken}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/${lang}/login`}>{text.goToLogin}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isInvitePreviewLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">{text.loadingTitle}</CardTitle>
            <CardDescription>{text.loadingDescription}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isInvitePreviewError || !invitePreview) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive text-xl">
              {text.invalidLinkTitle}
            </CardTitle>
            <CardDescription>{text.missingToken}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/${lang}/login`}>{text.goToLogin}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (invitePreview.status !== 'PENDING') {
    const isAccepted = invitePreview.status === 'ACCEPTED';
    const title = isAccepted ? text.alreadyAcceptedTitle : text.inactiveTitle;
    const description = isAccepted
      ? text.alreadyAcceptedDescription
      : text.inactiveDescription;

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">{text.invitedEmail}</p>
            <Input value={invitePreview.email} disabled />
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link
                href={`/${lang}/login?email=${encodeURIComponent(invitePreview.email)}`}
              >
                {text.goToLogin}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const onSubmit = (data: AcceptInviteInput) => {
    acceptInvite(data);
  };

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <Card className="border-primary/10 w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <ShieldCheck className="text-primary h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {text.title}
            </CardTitle>
            <CardDescription className="text-sm">
              {text.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormItem>
                    <FormLabel>{text.invitedEmail}</FormLabel>
                    <FormControl>
                      <Input value={invitePreview.email} disabled />
                    </FormControl>
                  </FormItem>
                </div>
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{text.firstName}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={text.firstNamePlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{text.lastName}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={text.lastNamePlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{text.password}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={text.passwordPlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{text.confirmPassword}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={text.passwordPlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="mt-6 w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {text.acceptButton}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
