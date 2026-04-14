'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Building2,
  Phone,
  Globe,
  Users,
  CreditCard,
  CircleCheck,
  CircleAlert,
  Link as LinkIcon,
} from 'lucide-react';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { BusinessService } from '@/lib/requests';
import { type ClientData } from '@/types/services';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function Business({
  businessId,
  dictionary,
  lang,
}: {
  businessId: string;
  dictionary: Dictionary;
  lang: Locale;
}) {
  const t = dictionary.pages.business;
  const queryClient = useQueryClient();
  const containerClass = 'w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8';
  const [selectedClient, setSelectedClient] = useState<
    ClientData | undefined
  >();

  const {
    data: clientsData,
    isLoading: isLoadingUsers,
    isError: isClientsError,
    refetch: refetchClients,
  } = useQuery({
    queryKey: ['business-clients', businessId],
    queryFn: () => BusinessService.getBusinessClients(businessId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
  });

  const {
    data: businessData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => BusinessService.getBusinessById(businessId, businessId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
  });

  const {
    data: stripeStatus,
    isLoading: isLoadingStripeStatus,
    isError: isStripeStatusError,
    refetch: refetchStripeStatus,
  } = useQuery({
    queryKey: ['business-stripe-status', businessId],
    queryFn: () => BusinessService.getStripeConnectStatus(businessId),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const connectStripeMutation = useMutation({
    mutationFn: () => BusinessService.getStripeOnboardingLink(businessId),
    onSuccess: (data) => {
      if (data.onboardingUrl) {
        toast.success(data.message || 'Stripe onboarding link generated');
        globalThis.location.assign(data.onboardingUrl);
      } else {
        toast.error('Failed to generate onboarding link');
      }
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : 'Unable to create Stripe onboarding link';
      toast.error(message);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['business-stripe-status', businessId],
      });
    },
  });

  const clients = clientsData?.clients ?? [];

  const business = businessData?.business;

  if (isLoading) {
    return (
      <div className={containerClass}>
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Details Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className={containerClass}>
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <div className="text-sm">
            {error ? t.failedToLoadDetails : t.businessNotFound}
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    approved:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  };

  // Normalize and safely lookup status color
  const getStatusColorClass = (status: string) => {
    const key = (status || '').toLowerCase().trim();
    if (Object.prototype.hasOwnProperty.call(statusColors, key)) {
      return statusColors[key as keyof typeof statusColors];
    }
    return statusColors.neutral;
  };

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
          <Badge className={getStatusColorClass(business.status)}>
            {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
          </Badge>
        </div>
        {business.description && (
          <p className="text-muted-foreground">{business.description}</p>
        )}
      </div>

      {/* Business Details Card */}
      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>{t.businessInformation}</CardTitle>
          <CardDescription>
            {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4" />
                  {t.phone}
                </div>
                <p className="text-sm font-medium">{business.phone}</p>
              </div>

              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4" />
                  {t.email}
                </div>
                <a
                  href={`mailto:${business.email}`}
                  className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {business.email}
                </a>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  {t.databaseName}
                </div>
                <p className="text-sm font-medium">{business.databaseName}</p>
              </div>

              {business.website && (
                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4" />
                    {t.website}
                  </div>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {business.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-2 border-t pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs font-medium">
                  {t.created}
                </div>
                <p className="text-sm font-medium">
                  {new Date(business.createdAt).toLocaleDateString(lang, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs font-medium">
                  {t.lastUpdated}
                </div>
                <p className="text-sm font-medium">
                  {new Date(business.updatedAt).toLocaleDateString(lang, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Connect */}
      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t.stripe?.title || 'Stripe Connect'}
          </CardTitle>
          <CardDescription>
            {t.stripe?.description ||
              'Connect your Stripe account to receive invoice payments directly.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingStripeStatus ? (
            <Skeleton className="h-16 w-full" />
          ) : isStripeStatusError ? (
            <div className="bg-destructive/10 text-destructive flex items-center justify-between gap-3 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm">
                <CircleAlert className="h-4 w-4" />
                {t.stripe?.verifyError || 'Unable to verify Stripe status.'}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void refetchStripeStatus();
                }}
              >
                {t.retry || 'Retry'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {stripeStatus?.isConnected ? (
                      <>
                        <CircleCheck className="h-4 w-4 text-emerald-600" />
                        {t.stripe?.connected || 'Connected'}
                      </>
                    ) : (
                      <>
                        <CircleAlert className="h-4 w-4 text-amber-600" />
                        {t.stripe?.notConnected || 'Not connected'}
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {stripeStatus?.message ||
                      t.stripe?.connectHint ||
                      'Connect Stripe to start receiving payments.'}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => connectStripeMutation.mutate()}
                  disabled={connectStripeMutation.isPending}
                  className="min-w-44"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  {connectStripeMutation.isPending
                    ? t.stripe?.preparingLink || 'Preparing link...'
                    : stripeStatus?.isConnected
                      ? t.stripe?.updateSetup || 'Update Stripe setup'
                      : t.stripe?.connectStripe || 'Connect Stripe'}
                </Button>
              </div>

              {stripeStatus?.stripeConnectId ? (
                <p className="text-muted-foreground text-xs">
                  {t.stripe?.account || 'Account'}:{' '}
                  {stripeStatus.stripeConnectId}
                </p>
              ) : undefined}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clients Section */}
      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.clientsSection} ({clients.length})
          </CardTitle>
          <CardDescription>{t.clientsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isClientsError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="text-destructive h-10 w-10" />
              <p className="text-foreground font-medium">
                {t.failedToLoadClients || t.errorLoading}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void refetchClients();
                }}
              >
                {t.retry || 'Retry'}
              </Button>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="text-muted-foreground h-12 w-12" />
              <p className="text-foreground font-medium">
                {t.noClientsAssigned}
              </p>
              <p className="text-muted-foreground text-sm">
                {t.noClientsAssignedHint}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="border-border hover:bg-accent hover:text-accent-foreground focus:ring-ring w-full rounded-lg border p-3 text-left transition-colors focus:ring-2 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {client.email}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Details Dialog */}
      <Dialog
        open={!!selectedClient}
        onOpenChange={(open) => {
          if (!open) setSelectedClient(undefined);
        }}
      >
        <DialogContent className="max-w-md">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle>{t.clientDetailsTitle}</DialogTitle>
                <DialogDescription>
                  {t.clientDetailsDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    {t.name}
                  </p>
                  <p className="font-medium">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    {t.email}
                  </p>
                  <a
                    href={`mailto:${selectedClient.email}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {selectedClient.email}
                  </a>
                </div>

                {selectedClient.phoneNumber && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm font-medium">
                      {t.phone}
                    </p>
                    <p className="font-medium">{selectedClient.phoneNumber}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    {t.created}
                  </p>
                  <p className="font-medium">
                    {new Date(selectedClient.createdAt).toLocaleDateString(
                      lang,
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
