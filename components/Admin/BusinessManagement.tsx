'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, Loader2, Trash2, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { localizeErrorMessage } from '@/lib/error-localization';
import { formatDateLong } from '@/lib/date-utils';
import { BusinessService } from '@/lib/requests';
import type {
  AllBusinessesResponse,
  BusinessApplicationItem,
  BusinessApplicationsListResponse,
  BusinessItem,
} from '@/types/ResponseInterfaces';
import type { Dictionary } from '@/get-dictionary';

type ReviewAction = 'approved' | 'rejected';

const EMPTY_APPLICATIONS: BusinessApplicationItem[] = [];
const EMPTY_BUSINESSES: BusinessItem[] = [];

const getStatusVariant = (status: BusinessItem['status']) => {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'destructive';
  return 'secondary';
};

const formatDate = (value?: string | Date | null): string => {
  if (!value) return '-';
  const dateString = typeof value === 'string' ? value : value.toISOString();
  return formatDateLong(dateString);
};

export default function BusinessManagement({
  dictionary,
}: {
  dictionary: Dictionary;
}) {
  const queryClient = useQueryClient();
  const t = dictionary.admin.businessManagement;

  const [applicationSearch, setApplicationSearch] = useState('');
  const [businessSearch, setBusinessSearch] = useState('');
  const [pendingReviewAppIds, setPendingReviewAppIds] = useState<Set<string>>(
    new Set()
  );
  const [deleteBusinessId, setDeleteBusinessId] = useState<
    string | undefined
  >();

  const [rejectModalApp, setRejectModalApp] = useState<
    BusinessApplicationItem | undefined
  >();
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectNotesError, setRejectNotesError] = useState<
    string | undefined
  >();

  const [deleteModalBusiness, setDeleteModalBusiness] = useState<
    BusinessItem | undefined
  >();

  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    isFetching: isFetchingApplications,
    error: applicationsError,
    refetch: refetchApplications,
  } = useQuery<BusinessApplicationsListResponse>({
    queryKey: ['business-applications'],
    queryFn: BusinessService.getApplications,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
  });

  const {
    data: businessesData,
    isLoading: isLoadingBusinesses,
    isFetching: isFetchingBusinesses,
    error: businessesError,
    refetch: refetchBusinesses,
  } = useQuery<AllBusinessesResponse>({
    queryKey: ['all-businesses'],
    queryFn: BusinessService.getAllBusinesses,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
  });

  const applications = useMemo(
    () => applicationsData?.applications ?? EMPTY_APPLICATIONS,
    [applicationsData?.applications]
  );

  const businesses = useMemo(
    () => businessesData?.businesses ?? EMPTY_BUSINESSES,
    [businessesData?.businesses]
  );

  const filteredApplications = useMemo(() => {
    const query = applicationSearch.trim().toLowerCase();
    if (!query) return applications;

    return applications.filter((app) => {
      const haystack = [
        app.businessName,
        app.description,
        app.phone,
        app.website ?? '',
        app.applicantId,
        app.status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [applicationSearch, applications]);

  const filteredBusinesses = useMemo(() => {
    const query = businessSearch.trim().toLowerCase();
    if (!query) return businesses;

    return businesses.filter((business) => {
      const haystack = [business.name, business.phone, business.status]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [businessSearch, businesses]);

  const pendingCount = applications.filter(
    (app) => app.status === 'pending'
  ).length;
  const approvedCount = businesses.filter(
    (business) => business.status === 'approved'
  ).length;

  const reviewMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
      reviewNotes,
    }: {
      applicationId: string;
      status: ReviewAction;
      reviewNotes: string;
    }) =>
      BusinessService.reviewApplication(applicationId, {
        status,
        reviewNotes,
      }),
    onMutate: ({ applicationId }) => {
      setPendingReviewAppIds((prev) => new Set(prev).add(applicationId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-applications'] });
      queryClient.invalidateQueries({ queryKey: ['all-businesses'] });
      toast.success(t.reviewSuccess);
      setRejectModalApp(undefined);
      setRejectNotes('');
      setRejectNotesError(undefined);
    },
    onError: (error: unknown) => {
      toast.error(localizeErrorMessage(error, dictionary, t.reviewError));
    },
    onSettled: (_, __, variables) => {
      if (variables?.applicationId) {
        setPendingReviewAppIds((prev) => {
          const next = new Set(prev);
          next.delete(variables.applicationId);
          return next;
        });
      }
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: (businessId: string) =>
      BusinessService.deleteBusiness(businessId),
    onMutate: (businessId) => {
      setDeleteBusinessId(businessId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business-applications'] });
      toast.success(t.deleteSuccess);
      setDeleteModalBusiness(undefined);
    },
    onError: (error: unknown) => {
      toast.error(localizeErrorMessage(error, dictionary, t.deleteError));
    },
    onSettled: () => {
      setDeleteBusinessId(undefined);
    },
  });

  const reviewApplication = (
    application: BusinessApplicationItem,
    status: ReviewAction
  ) => {
    if (status === 'rejected') {
      setRejectModalApp(application);
      setRejectNotes('');
      setRejectNotesError(undefined);
      return;
    }

    reviewMutation.mutate({
      applicationId: application.id,
      status,
      reviewNotes: t.defaultApprovalNote,
    });
  };

  const submitRejectReview = () => {
    if (!rejectModalApp) return;

    const notes = rejectNotes.trim();
    if (notes.length === 0) {
      setRejectNotesError(t.reviewNotesRequired);
      return;
    }

    setRejectNotesError(undefined);
    reviewMutation.mutate({
      applicationId: rejectModalApp.id,
      status: 'rejected',
      reviewNotes: notes,
    });
  };

  const applicationsLoadError = applicationsError
    ? localizeErrorMessage(
        applicationsError,
        dictionary,
        t.loadApplicationsError
      )
    : t.loadApplicationsError;

  const businessesLoadError = businessesError
    ? localizeErrorMessage(businessesError, dictionary, t.loadBusinessesError)
    : t.loadBusinessesError;

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isFetchingApplications || isFetchingBusinesses}
          onClick={() => {
            refetchApplications();
            refetchBusinesses();
          }}
        >
          {t.refresh}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t.stats.pendingApplications}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoadingApplications || applicationsError ? '—' : pendingCount}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>

        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t.stats.totalBusinesses}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoadingBusinesses || businessesError ? '—' : businesses.length}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>

        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t.stats.approvedBusinesses}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoadingBusinesses || businessesError ? '—' : approvedCount}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      </div>

      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader className="space-y-2">
          <div>
            <CardTitle>{t.applications.title}</CardTitle>
            <CardDescription>{t.applications.description}</CardDescription>
          </div>
          <div className="relative md:w-sm">
            <Input
              value={applicationSearch}
              onChange={(event) => setApplicationSearch(event.target.value)}
              placeholder={t.applications.searchPlaceholder}
              className="pr-10"
            />
            {applicationSearch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setApplicationSearch('')}
                aria-label={dictionary.common.clear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {applicationsError ? (
            <div className="space-y-3">
              <div className="text-destructive text-sm">
                {applicationsLoadError}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => refetchApplications()}
              >
                {dictionary.common.retry}
              </Button>
            </div>
          ) : isLoadingApplications ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              {t.applications.noResults}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.applications.columns.business}</TableHead>
                  <TableHead>{t.applications.columns.applicantId}</TableHead>
                  <TableHead>{t.applications.columns.phone}</TableHead>
                  <TableHead>{t.applications.columns.status}</TableHead>
                  <TableHead>{t.applications.columns.submitted}</TableHead>
                  <TableHead className="text-right">
                    {t.applications.columns.actions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => {
                  const isPending = application.status === 'pending';
                  const isReviewing = pendingReviewAppIds.has(application.id);

                  return (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="font-medium">
                          {application.businessName}
                        </div>
                        <div className="text-muted-foreground max-w-xs truncate text-xs">
                          {application.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {application.applicantId}
                      </TableCell>
                      <TableCell>{application.phone}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(application.status)}>
                          {t.status[
                            application.status as keyof typeof t.status
                          ] || application.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(application.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {isPending ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                reviewApplication(application, 'approved')
                              }
                              disabled={isReviewing}
                            >
                              {isReviewing ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="mr-1 h-4 w-4" />
                              )}
                              {t.actions.approve}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                reviewApplication(application, 'rejected')
                              }
                              disabled={isReviewing}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              {t.actions.reject}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {t.applications.reviewed}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader className="space-y-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t.businesses.title}
            </CardTitle>
            <CardDescription>{t.businesses.description}</CardDescription>
          </div>
          <div className="relative md:w-sm">
            <Input
              value={businessSearch}
              onChange={(event) => setBusinessSearch(event.target.value)}
              placeholder={t.businesses.searchPlaceholder}
              className="pr-10"
            />
            {businessSearch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setBusinessSearch('')}
                aria-label={dictionary.common.clear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {businessesError ? (
            <div className="space-y-3">
              <div className="text-destructive text-sm">
                {businessesLoadError}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => refetchBusinesses()}
              >
                {dictionary.common.retry}
              </Button>
            </div>
          ) : isLoadingBusinesses ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              {t.businesses.noResults}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.businesses.columns.name}</TableHead>
                  <TableHead>{t.businesses.columns.phone}</TableHead>
                  <TableHead>{t.businesses.columns.status}</TableHead>
                  <TableHead>{t.businesses.columns.created}</TableHead>
                  <TableHead className="text-right">
                    {t.businesses.columns.actions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.map((business) => {
                  const isDeleting = deleteBusinessId === business.id;

                  return (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">
                        {business.name}
                      </TableCell>
                      <TableCell>{business.phone}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(business.status)}>
                          {t.status[business.status as keyof typeof t.status] ||
                            business.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(business.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteModalBusiness(business)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-4 w-4" />
                          )}
                          {dictionary.common.delete}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={rejectModalApp !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setRejectModalApp(undefined);
            setRejectNotes('');
            setRejectNotesError(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rejectDialog.title}</DialogTitle>
            <DialogDescription>
              {t.rejectDialog.description.replace(
                '{businessName}',
                rejectModalApp?.businessName ?? t.rejectDialog.fallbackBusiness
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Textarea
              value={rejectNotes}
              onChange={(event) => setRejectNotes(event.target.value)}
              rows={4}
              placeholder={t.rejectDialog.notesPlaceholder}
            />
            {rejectNotesError && (
              <p className="text-destructive text-sm">{rejectNotesError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setRejectModalApp(undefined);
                setRejectNotes('');
                setRejectNotesError(undefined);
              }}
              disabled={reviewMutation.isPending}
            >
              {dictionary.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={submitRejectReview}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending
                ? t.rejectDialog.rejecting
                : t.actions.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteModalBusiness !== undefined}
        onOpenChange={(open) => {
          if (!open) setDeleteModalBusiness(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteDialog.title}</DialogTitle>
            <DialogDescription>
              {t.deleteDialog.description.replace(
                '{businessName}',
                deleteModalBusiness?.name ?? t.deleteDialog.fallbackBusiness
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteModalBusiness(undefined)}
              disabled={deleteBusinessMutation.isPending}
            >
              {dictionary.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteModalBusiness) return;
                deleteBusinessMutation.mutate(deleteModalBusiness.id);
              }}
              disabled={
                deleteBusinessMutation.isPending || !deleteModalBusiness
              }
            >
              {deleteBusinessMutation.isPending
                ? t.deleteDialog.deleting
                : dictionary.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
