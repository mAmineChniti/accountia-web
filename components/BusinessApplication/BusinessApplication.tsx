'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import {
    BusinessApplicationSchema,
    type BusinessApplicationInput,
} from '@/types/RequestSchemas';

export default function BusinessApplication({
    dictionary,
    lang,
}: {
    dictionary: Dictionary;
    lang: Locale;
}) {
    const router = useRouter();
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const { data: fetchUserRes, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => AuthService.fetchUser(),
    });

    const user = fetchUserRes?.user;

    const t = dictionary.pages.businessApplication;

    const form = useForm<BusinessApplicationInput>({
        resolver: zodResolver(BusinessApplicationSchema),
        defaultValues: {
            businessName: '',
            businessType: '',
            description: '',
            website: '',
        },
        mode: 'onChange',
    });

    const queryClient = useQueryClient();

    const applicationMutation = useMutation({
        mutationFn: (data: BusinessApplicationInput) =>
            AuthService.applyForBusiness(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            setShowSuccessDialog(true);
        },
        onError: (error: unknown) => {
            if (error instanceof ApiError) {
                toast.error(error.message || t.submitError);
            } else {
                toast.error(t.submitError);
            }
        },
    });

    const onSubmit = (data: BusinessApplicationInput) => {
        applicationMutation.mutate(data);
    };

    const isSubmittingOrSuccess = applicationMutation.isPending || applicationMutation.isSuccess;

    const businessTypes = [
        { value: 'freelance', label: t.businessTypes.freelance },
        { value: 'startup', label: t.businessTypes.startup },
        { value: 'sme', label: t.businessTypes.sme },
        { value: 'enterprise', label: t.businessTypes.enterprise },
        { value: 'nonprofit', label: t.businessTypes.nonprofit },
        { value: 'other', label: t.businessTypes.other },
    ];

    return (
        <main className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center py-8">
            <Card className="mx-4 w-full max-w-lg" tabIndex={-1}>
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold" tabIndex={-1}>
                        {t.title}
                    </CardTitle>
                    <CardDescription className="text-base" tabIndex={-1}>
                        {t.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <span className="animate-spin text-2xl">⏳</span>
                        </div>
                    ) : user?.role && ['BUSINESS_OWNER', 'BUSINESS_ADMIN', 'PLATFORM_ADMIN', 'PLATFORM_OWNER'].includes(user.role) ? (
                        <div className="text-center p-6 space-y-4">
                            <div className="text-4xl">💼</div>
                            <h3 className="text-xl font-semibold">Already a Business Owner</h3>
                            <p className="text-muted-foreground">You already have access to business features.</p>
                            <Button onClick={() => router.push(`/${lang}`)} className="mt-4">Back to Home</Button>
                        </div>
                    ) : user?.hasApplied ? (
                        <div className="text-center p-6 space-y-4">
                            <div className="text-4xl">⏳</div>
                            <h3 className="text-xl font-semibold">Application Pending</h3>
                            <p className="text-muted-foreground">Your business application has been submitted and is currently under review by our team.</p>
                            <Button onClick={() => router.push(`/${lang}`)} className="mt-4" variant="outline">Back to Home</Button>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                                    type="text"
                                                    placeholder={t.businessNamePlaceholder}
                                                    aria-describedby="businessName-error"
                                                    aria-invalid={!!form.formState.errors.businessName}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                id="businessName-error"
                                                role="alert"
                                                aria-live="polite"
                                            />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="businessType"
                                    render={({ field }) => (
                                        <FormItem className="gap-1.5">
                                            <FormLabel htmlFor="businessType">
                                                {t.businessTypeLabel}
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger id="businessType">
                                                        <SelectValue
                                                            placeholder={t.businessTypePlaceholder}
                                                        />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {businessTypes.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage
                                                id="businessType-error"
                                                role="alert"
                                                aria-live="polite"
                                            />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="gap-1.5">
                                            <FormLabel htmlFor="description">
                                                {t.descriptionLabel}
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    id="description"
                                                    placeholder={t.descriptionPlaceholder}
                                                    aria-describedby="description-error"
                                                    aria-invalid={!!form.formState.errors.description}
                                                    rows={4}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                id="description-error"
                                                role="alert"
                                                aria-live="polite"
                                            />
                                        </FormItem>
                                    )}
                                />

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
                                                    aria-describedby="website-error"
                                                    aria-invalid={!!form.formState.errors.website}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                id="website-error"
                                                role="alert"
                                                aria-live="polite"
                                            />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmittingOrSuccess}
                                >
                                    {isSubmittingOrSuccess
                                        ? t.submittingButton
                                        : t.submitButton}
                                </Button>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>

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
                            onClick={() => {
                                setShowSuccessDialog(false);
                                router.push(`/${lang}`);
                            }}
                            className="w-full"
                        >
                            {t.closeButton}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
