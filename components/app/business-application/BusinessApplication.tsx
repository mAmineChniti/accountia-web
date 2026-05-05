/* eslint-disable */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { BusinessService } from '@/lib/requests';
import {
  CreateBusinessApplicationSchema,
  type CreateBusinessApplicationFormInput,
  type CreateBusinessApplicationInput,
} from '@/types/services';
import { localizeErrorMessage } from '@/lib/error-localization';
import { Textarea } from '@/components/ui/textarea';

export default function BusinessApplication({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const router = useRouter();
  const t = dictionary.pages.businessApplication;
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<
    CreateBusinessApplicationFormInput,
    unknown,
    CreateBusinessApplicationInput
  >({
    resolver: zodResolver(CreateBusinessApplicationSchema),
    defaultValues: {
      businessName: '',
      description: '',
      website: '',
      businessEmail: '',
      phone: '',
    },
    mode: 'onChange',
  });

  const applicationMutation = useMutation({
    mutationFn: (data: CreateBusinessApplicationInput) =>
      BusinessService.applyForBusiness(data),
    onSuccess: () => {
      // Invalidate business-related queries
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business-applications'] });
      setShowSuccessDialog(true);
    },
    onError: (error: unknown) => {
      toast.error(localizeErrorMessage(error, dictionary, t.submitError));
    },
  });

  const onSubmit = (data: CreateBusinessApplicationInput) => {
    applicationMutation.mutate(data);
  };

  const isPending =
    applicationMutation.isPending || applicationMutation.isSuccess;

  return (
    <main className="from-muted/60 to-background min-h-[90vh] bg-linear-to-br py-10">
      <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
        <Card className="dark:bg-card/90 rounded-2xl border-0 bg-white/90 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">{t.title}</CardTitle>
            <CardDescription className="text-base">
              {t.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Business Name */}
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="businessName">
                          {t.businessNameLabel}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="businessName"
                            placeholder={t.businessNamePlaceholder}
                            aria-invalid={!!form.formState.errors.businessName}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage role="alert" aria-live="polite" />
                      </FormItem>
                    )}
                  />

                  {/* Business Email */}
                  <FormField
                    control={form.control}
                    name="businessEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="businessEmail">
                          {t.businessEmailLabel}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="businessEmail"
                            type="email"
                            placeholder={t.businessEmailPlaceholder}
                            aria-invalid={!!form.formState.errors.businessEmail}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage role="alert" aria-live="polite" />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="phone">{t.phoneLabel}</FormLabel>
                        <FormControl>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder={t.phonePlaceholder}
                            aria-invalid={!!form.formState.errors.phone}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage role="alert" aria-live="polite" />
                      </FormItem>
                    )}
                  />

                  {/* Website (optional) */}
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="website">
                          {t.websiteLabel}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="website"
                            type="url"
                            placeholder={t.websitePlaceholder}
                            aria-invalid={!!form.formState.errors.website}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage role="alert" aria-live="polite" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description - Full width */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="description">
                        {t.descriptionLabel}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id="description"
                          rows={4}
                          placeholder={t.descriptionPlaceholder}
                          aria-invalid={!!form.formState.errors.description}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage role="alert" aria-live="polite" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" className="px-8" disabled={isPending}>
                    {isPending ? t.submittingButton : t.submitButton}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Success dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              {t.successTitle}
            </DialogTitle>
            <DialogDescription>{t.successMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                setShowSuccessDialog(false);
                router.push(`/${lang}`);
              }}
            >
              {t.closeButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
