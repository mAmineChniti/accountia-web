'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

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
import { Separator } from '@/components/ui/separator';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { useUpdateProfile } from '@/hooks/useAuth';
import type { UpdateUserInput } from '@/types/RequestSchemas';
import type { UserProfile } from '@/types/ResponseInterfaces';

interface ProfileProps {
  dictionary: Dictionary;
  _lang: Locale;
  user: UserProfile;
}

const ProfileFormSchema = z
  .object({
    username: z.string().min(5).max(20),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.email(),
    phoneNumber: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasPassword = !!data.password?.trim();
      if (!hasPassword) return true;
      return data.password!.length >= 6;
    },
    {
      message: 'Password must be at least 6 characters',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      const hasPassword = !!data.password?.trim();
      if (!hasPassword) return true;
      return data.password === (data.confirmPassword ?? '');
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

type ProfileFormInput = z.infer<typeof ProfileFormSchema>;

export default function Profile({ dictionary, _lang, user }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [requestError, setRequestError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    form.reset({
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      password: '',
      confirmPassword: '',
    });
  }, [form, user]);

  const onSubmit = async (data: ProfileFormInput) => {
    setRequestError(undefined);
    setShowSuccess(false);

    const payload: UpdateUserInput = {
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber?.trim() ? data.phoneNumber : undefined,
    };

    if (data.password?.trim()) {
      payload.password = data.password;
    }

    updateProfile(payload, {
      onSuccess: (response) => {
        if ('user' in response) {
          form.reset({
            username: response.user.username || payload.username || '',
            firstName: response.user.firstName || '',
            lastName: response.user.lastName || '',
            email: response.user.email || '',
            phoneNumber: response.user.phoneNumber || payload.phoneNumber || '',
            password: '',
            confirmPassword: '',
          });

          setIsEditing(false);
          setShowSuccess(true);
          toast.success(
            dictionary.pages?.profile?.successMessage ||
              'Profile updated successfully'
          );
        }
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : dictionary.pages?.profile?.errorMessage ||
              'Failed to update profile';

        setRequestError(message);
        toast.error(message);
      },
    });
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setShowSuccess(false);
    setRequestError(undefined);
  };

  const handleCancelEdit = () => {
    form.reset({
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      password: '',
      confirmPassword: '',
    });
    setIsEditing(false);
    setRequestError(undefined);
    setShowSuccess(false);
  };

  const isFormDisabled = !isEditing || isPending;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{dictionary.pages?.profile?.title || 'Profile'}</CardTitle>
          <CardDescription>
            {dictionary.pages?.profile?.description ||
              'Update your personal information'}
          </CardDescription>
        </div>
        {isEditing ? undefined : (
          <Button type="button" onClick={handleStartEdit}>
            {dictionary.common?.edit || 'Edit'}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <fieldset disabled={isFormDisabled} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="username">Username</FormLabel>
                    <FormControl>
                      <Input
                        id="username"
                        placeholder="username"
                        aria-describedby="username-error"
                        aria-invalid={!!form.formState.errors.username}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id="username-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="firstName">
                      {dictionary.pages?.profile?.firstNameLabel ||
                        'First Name'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="firstName"
                        placeholder={
                          dictionary.pages?.profile?.firstNamePlaceholder ||
                          'John'
                        }
                        aria-describedby="firstName-error"
                        aria-invalid={!!form.formState.errors.firstName}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id="firstName-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="lastName">
                      {dictionary.pages?.profile?.lastNameLabel || 'Last Name'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="lastName"
                        placeholder={
                          dictionary.pages?.profile?.lastNamePlaceholder ||
                          'Doe'
                        }
                        aria-describedby="lastName-error"
                        aria-invalid={!!form.formState.errors.lastName}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id="lastName-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">
                      {dictionary.pages?.profile?.emailLabel || 'Email'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        placeholder={
                          dictionary.pages?.profile?.emailPlaceholder ||
                          'john@example.com'
                        }
                        aria-describedby="email-error"
                        aria-invalid={!!form.formState.errors.email}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id="email-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="phoneNumber">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        id="phoneNumber"
                        placeholder="+33 6 12 34 56 78"
                        aria-describedby="phoneNumber-error"
                        aria-invalid={!!form.formState.errors.phoneNumber}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage id="phoneNumber-error" />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="password">
                      {dictionary.pages?.changePassword?.newPasswordLabel ||
                        'New Password'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Leave blank to keep current password"
                        aria-describedby="password-error"
                        aria-invalid={!!form.formState.errors.password}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage id="password-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="confirmPassword">
                      {dictionary.pages?.changePassword?.confirmPasswordLabel ||
                        'Confirm Password'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        aria-describedby="confirmPassword-error"
                        aria-invalid={!!form.formState.errors.confirmPassword}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage id="confirmPassword-error" />
                  </FormItem>
                )}
              />
            </fieldset>

            {requestError ? (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm">{requestError}</span>
              </div>
            ) : undefined}

            {showSuccess ? (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
              >
                <Check
                  className="mt-0.5 h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm">
                  {dictionary.pages?.profile?.successMessage ||
                    'Profile updated successfully'}
                </span>
              </div>
            ) : undefined}

            {isEditing ? (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelEdit}
                  disabled={isPending}
                >
                  {dictionary.common?.cancel || 'Cancel'}
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending
                    ? dictionary.pages?.profile?.savingButton || 'Saving...'
                    : dictionary.pages?.profile?.saveButton || 'Save Changes'}
                </Button>
              </div>
            ) : undefined}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
