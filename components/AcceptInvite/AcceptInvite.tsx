'use client';

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
      toast.success(t.successMsg);
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
        toast.info(
          'Invitation already accepted. Please log in with the invited email.'
        );
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
        'Failed to accept invitation'
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
              Invalid Link
            </CardTitle>
            <CardDescription>{t.missingToken}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/${lang}/login`}>Go to Login</Link>
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
            <CardTitle className="text-xl">Loading invitation...</CardTitle>
            <CardDescription>
              Please wait while we verify your invitation link.
            </CardDescription>
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
              Invalid Link
            </CardTitle>
            <CardDescription>{t.missingToken}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/${lang}/login`}>Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (invitePreview.status !== 'PENDING') {
    const isAccepted = invitePreview.status === 'ACCEPTED';
    const title = isAccepted
      ? 'Invitation Already Accepted'
      : 'Invitation Not Active';
    const description = isAccepted
      ? 'This invitation has already been accepted. Please sign in with the invited email below.'
      : 'This invitation is no longer active. Please request a new invitation from the Business Owner.';

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">Invited email</p>
            <Input value={invitePreview.email} disabled />
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link
                href={`/${lang}/login?email=${encodeURIComponent(invitePreview.email)}`}
              >
                Go to Login
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
              {t.title}
            </CardTitle>
            <CardDescription className="text-sm">
              {t.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormItem>
                    <FormLabel>Invited Email</FormLabel>
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
                      <FormLabel>{t.firstName}</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
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
                      <FormLabel>{t.lastName}</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
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
                    <FormLabel>{t.password}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
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
                    <FormLabel>{t.confirmPassword}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
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
                {t.acceptButton}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
