'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { useChangePassword } from '@/hooks/useAuth';
import {
  ChangePasswordSchema,
  type ChangePasswordInput,
} from '@/types/RequestSchemas';

interface ChangePasswordProps {
  dictionary: Dictionary;
  _lang: Locale;
}

export default function ChangePassword({
  dictionary,
  _lang,
}: ChangePasswordProps) {
  const changePasswordMutation = useChangePassword();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { mutate: changePassword, isPending } = useChangePassword();

  const onSubmit = async (data: ChangePasswordInput) => {
    changePassword(data, {
      onSuccess: () => {
        toast.success(
          dictionary.pages?.changePassword?.successMessage ||
            'Password changed successfully'
        );
        // Reset form
        form.reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : dictionary.pages?.changePassword?.errorMessage ||
              'Failed to change password';
        toast.error(message);
      },
    });
  };

  const isLoading = isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {dictionary.pages?.changePassword?.title || 'Change Password'}
        </CardTitle>
        <CardDescription>
          {dictionary.pages?.changePassword?.description ||
            'Update your password to keep your account secure'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Form {...form}>
            <fieldset disabled={isLoading} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="currentPassword">
                      {dictionary.pages?.changePassword?.currentPasswordLabel ||
                        'Current Password'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        placeholder={
                          dictionary.pages?.changePassword
                            ?.currentPasswordPlaceholder ||
                          'Enter your current password'
                        }
                        aria-describedby="currentPassword-error"
                        aria-invalid={!!form.formState.errors.currentPassword}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id="currentPassword-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="newPassword">
                      {dictionary.pages?.changePassword?.newPasswordLabel ||
                        'New Password'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder={
                          dictionary.pages?.changePassword
                            ?.newPasswordPlaceholder ||
                          'Enter your new password'
                        }
                        aria-describedby="newPassword-error"
                        aria-invalid={!!form.formState.errors.newPassword}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id="newPassword-error" />
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
                        autoComplete="new-password"
                        placeholder={
                          dictionary.pages?.changePassword
                            ?.confirmPasswordPlaceholder ||
                          'Confirm your new password'
                        }
                        aria-describedby="confirmPassword-error"
                        aria-invalid={!!form.formState.errors.confirmPassword}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id="confirmPassword-error" />
                  </FormItem>
                )}
              />
            </fieldset>

            {changePasswordMutation.isError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm">
                  {changePasswordMutation.error instanceof Error
                    ? changePasswordMutation.error.message
                    : dictionary.pages?.changePassword?.errorMessage ||
                      'Failed to change password'}
                </span>
              </div>
            )}

            {changePasswordMutation.isSuccess && (
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
                  {dictionary.pages?.changePassword?.successMessage ||
                    'Password changed successfully'}
                </span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? dictionary.pages?.changePassword?.updatingButton ||
                  'Updating...'
                : dictionary.pages?.changePassword?.updateButton ||
                  'Update Password'}
            </Button>
          </Form>
        </form>
      </CardContent>
    </Card>
  );
}
