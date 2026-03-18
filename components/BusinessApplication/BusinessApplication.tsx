'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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
import { cn } from '@/lib/utils';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { BusinessService } from '@/lib/requests';
import {
  BusinessApplicationSchema,
  type BusinessApplicationInput,
} from '@/types/RequestSchemas';
import { localizeErrorMessage } from '@/lib/error-localization';

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

  const form = useForm<BusinessApplicationInput>({
    resolver: zodResolver(BusinessApplicationSchema),
    defaultValues: {
      businessName: '',
      description: '',
      website: '',
      phone: '',
    },
    mode: 'onChange',
  });

  const applicationMutation = useMutation({
    mutationFn: (data: BusinessApplicationInput) =>
      BusinessService.applyForBusiness(data),
    onSuccess: () => {
      setShowSuccessDialog(true);
    },
    onError: (error: unknown) => {
      toast.error(localizeErrorMessage(error, dictionary, t.submitError));
    },
  });

  const onSubmit = (data: BusinessApplicationInput) => {
    applicationMutation.mutate(data);
  };

  const isPending =
    applicationMutation.isPending || applicationMutation.isSuccess;

  return (
    <main className="bg-muted/30 flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <Card className="mx-4 w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t.title}</CardTitle>
          <CardDescription className="text-base">
            {t.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Business Name */}
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem className="gap-1.5">
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

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="gap-1.5">
                    <FormLabel htmlFor="description">
                      {t.descriptionLabel}
                    </FormLabel>
                    <FormControl>
                      <textarea
                        id="description"
                        rows={4}
                        placeholder={t.descriptionPlaceholder}
                        aria-invalid={!!form.formState.errors.description}
                        className={cn(
                          'border-input placeholder:text-muted-foreground focus-visible:ring-ring/50 dark:bg-input/30 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                          'focus-visible:border-ring focus-visible:ring-[3px]',
                          'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
                          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
                        )}
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
                  <FormItem className="gap-1.5">
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
                  <FormItem className="gap-1.5">
                    <FormLabel htmlFor="website">{t.websiteLabel}</FormLabel>
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

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t.submittingButton : t.submitButton}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

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
