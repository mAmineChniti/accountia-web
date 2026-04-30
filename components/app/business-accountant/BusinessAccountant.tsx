'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  skipToken,
} from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  FileText,
  ChevronRight,
  XCircle,
  PlayCircle,
  Calendar as CalendarIcon,
  Ban,
} from 'lucide-react';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { AccountantService } from '@/lib/services';
import type {
  AccountantHealthResponseDto,
  ReadinessResponseDto,
  QuickHealthResponseDto,
  GetJobResultsResponseDto,
} from '@/types/services';
import { cn } from '@/lib/utils';
import { formatDate, dateToISOString } from '@/lib/date-utils';
import { JobResultsView } from './JobResultsView';
import { TaxSummaryView } from './TaxSummaryView';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { type DateRange } from 'react-day-picker';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

import type {
  AccountantJobStatus,
  CreateAccountingJobInput,
} from '@/types/services';

interface BusinessAccountantProps {
  businessId: string;
  lang: Locale;
  dictionary: Dictionary;
}

const statusIcons: Record<AccountantJobStatus, typeof Clock> = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: Ban,
};

export default function BusinessAccountant({
  businessId,
  lang,
  dictionary,
}: BusinessAccountantProps) {
  const queryClient = useQueryClient();
  const t = dictionary.pages.businessAccountant;
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['accountant-jobs', businessId],
    queryFn: () => AccountantService.listJobs({ businessId }),
    enabled: !!businessId,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const { data: jobResults, isLoading: jobResultsLoading } = useQuery({
    queryKey: ['accountant-job-results', businessId, selectedJobId],
    queryFn:
      selectedJobId && businessId
        ? () =>
            AccountantService.getJobResults(
              { taskId: selectedJobId },
              { businessId }
            )
        : skipToken,
  });
  const [fetchedJobResults, setFetchedJobResults] = useState<
    GetJobResultsResponseDto['results'] | undefined
  >();

  const handleViewResults = async (taskId: string) => {
    try {
      setSelectedJobId(taskId);
      setActiveTab('overview');
      setFetchedJobResults(undefined);
      const resp = await AccountantService.getJobResults(
        { taskId },
        { businessId }
      );
      setFetchedJobResults(resp.results);
    } catch (error: unknown) {
      const e = error as Error;
      toast.error(e.message || t.loadError);
    }
  };

  const { data: taxData, isLoading: taxLoading } = useQuery({
    queryKey: ['accountant-taxes', businessId, selectedYear],
    queryFn: () =>
      AccountantService.getTaxes({ businessId, year: selectedYear }),
    enabled: !!businessId && !!selectedYear,
  });

  const { data: healthData } = useQuery<AccountantHealthResponseDto>({
    queryKey: ['accountant-health'],
    queryFn: () => AccountantService.health(),
    retry: 1,
  });

  const createJobMutation = useMutation({
    mutationFn: (data: CreateAccountingJobInput) =>
      AccountantService.createJob(data),
    onSuccess: () => {
      toast.success(t.jobCreated);
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ['accountant-jobs', businessId],
      });
    },
    onError: (error: unknown) => {
      const err = error as Error;
      toast.error(err.message || t.jobCreateError);
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: ({ taskId }: { taskId: string }) =>
      AccountantService.cancelJob({ taskId }, { businessId }),
    onSuccess: (data) => {
      const message = data?.result?.message || t.jobCancelled;
      toast.success(message);
      queryClient.invalidateQueries({
        queryKey: ['accountant-jobs', businessId],
      });
    },
    onError: (error: unknown) => {
      const err = error as Error;
      toast.error(err.message || t.cancelJobError);
    },
  });

  const calculateTaxesMutation = useMutation({
    mutationFn: () =>
      AccountantService.calculateTaxes({ businessId, year: selectedYear }),
    onSuccess: (data) => {
      const message = data.result.message ?? t.taxesCalculated;
      toast.success(message);
      queryClient.invalidateQueries({
        queryKey: ['accountant-taxes', businessId, selectedYear],
      });
    },
    onError: (error: unknown) => {
      const err = error as Error;
      toast.error(err.message || t.calculateTaxesError);
    },
  });

  const formatCurrency = (amount: number, currency = 'TND') => {
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleCreateJob = () => {
    if (!dateRange?.from || !dateRange?.to) return;
    createJobMutation.mutate({
      // Send camelCase as required by CreateAccountingJobInput
      businessId,
      periodStart: dateToISOString(dateRange.from),
      periodEnd: dateToISOString(dateRange.to),
    });
  };

  const jobs = useMemo(() => {
    return jobsData?.jobs ?? [];
  }, [jobsData]);

  const taxSummary = useMemo(() => taxData?.taxes, [taxData]);
  const selectedJobResults = useMemo(
    () => fetchedJobResults ?? jobResults?.results,
    [fetchedJobResults, jobResults]
  );
  const isServiceAvailable = (() => {
    if (!healthData) return false;
    const status = (healthData as ReadinessResponseDto | QuickHealthResponseDto)
      .status;
    return status === 'ready' || status === 'healthy' || status === 'available';
  })();

  const renderStatusBadge = (status: AccountantJobStatus) => {
    const Icon = statusIcons[status] || Clock; // Fallback to Clock for unknown statuses
    return (
      <Badge
        className={cn(
          'gap-1',
          status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-secondary'
        )}
      >
        <Icon
          className={cn('h-3 w-3', status === 'processing' && 'animate-spin')}
        />
        {t.status[status] || status}
      </Badge>
    );
  };

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
          {mounted && (
            <Badge
              className={cn(
                'gap-1',
                isServiceAvailable
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
              )}
            >
              {isServiceAvailable ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  {t.serviceAvailable}
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  {t.serviceUnavailable}
                </>
              )}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={!isServiceAvailable}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t.createJob}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalJobs}</CardDescription>
            <CardTitle className="text-3xl">
              {jobsLoading ? <Skeleton className="h-8 w-16" /> : jobs.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.pendingJobs}</CardDescription>
            <CardTitle className="text-3xl">
              {jobsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                jobs.filter((j) => j.status === 'pending').length
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.processingJobs}</CardDescription>
            <CardTitle className="text-3xl">
              {jobsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                jobs.filter((j) => j.status === 'processing').length
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.completedJobs}</CardDescription>
            <CardTitle className="text-3xl">
              {jobsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                jobs.filter((j) => j.status === 'completed').length
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">{t.tabs.overview}</TabsTrigger>
          <TabsTrigger value="jobs">{t.tabs.jobs}</TabsTrigger>
          <TabsTrigger value="taxes">{t.tabs.taxes}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {jobResultsLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : selectedJobResults ? (
            <JobResultsView
              results={selectedJobResults}
              t={t}
              lang={lang}
              formatCurrency={formatCurrency}
              onClose={() => setSelectedJobId(undefined)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t.overviewTitle}</CardTitle>
                <CardDescription>{t.overviewDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : jobs.filter((j) => j.status === 'completed').length ===
                  0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    <FileText className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>{t.noCompletedJobs}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {jobs
                      .filter((j) => j.status === 'completed')
                      .slice(0, 3)
                      .map((job) => (
                        <Button
                          variant="ghost"
                          key={job.taskId}
                          className="hover:bg-muted flex h-auto w-full cursor-pointer items-center justify-between rounded-lg border p-4 text-left transition-colors"
                          onClick={() => handleViewResults(job.taskId)}
                        >
                          <div className="space-y-1">
                            <p className="font-medium">
                              {formatDate(job.periodStart, lang)}
                              {' - '}
                              {formatDate(job.periodEnd, lang)}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {t.status[job.status]}
                            </p>
                          </div>
                          <ChevronRight className="text-muted-foreground h-5 w-5" />
                        </Button>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>{t.jobsTitle}</CardTitle>
              <CardDescription>{t.jobsDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {jobsError ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t.loadError}
                      {jobsError instanceof Error && (
                        <span className="mt-1 block text-xs opacity-80">
                          {jobsError.message}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => refetchJobs()} variant="outline">
                    {t.retry}
                  </Button>
                </div>
              ) : jobsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <PlayCircle className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>{t.noJobs}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.periodColumn}</TableHead>
                        <TableHead>{t.statusColumn}</TableHead>
                        <TableHead>{t.progressColumn}</TableHead>
                        <TableHead>{t.entriesColumn}</TableHead>
                        <TableHead className="text-right">
                          {t.actionsColumn}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.taskId}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {formatDate(job.periodStart, lang)} -{' '}
                                {formatDate(job.periodEnd, lang)}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {job.startedAt
                                  ? formatDate(job.startedAt, lang)
                                  : '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{renderStatusBadge(job.status)}</TableCell>
                          <TableCell>
                            <div className="w-full max-w-[100px]">
                              <Progress
                                value={job.progressPercent ?? 0}
                                className="h-2"
                              />
                              <span className="text-muted-foreground text-xs">
                                {job.progressPercent ?? 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{job.journalEntriesCount}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {job.status === 'pending' ||
                              job.status === 'processing' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={cancelJobMutation.isPending}
                                  onClick={() =>
                                    cancelJobMutation.mutate({
                                      taskId: job.taskId,
                                    })
                                  }
                                >
                                  {cancelJobMutation.isPending
                                    ? t.cancelling
                                    : t.cancel}
                                </Button>
                              ) : job.status === 'completed' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewResults(job.taskId)}
                                >
                                  {t.viewResults}
                                </Button>
                              ) : undefined}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label>{t.selectYear}</Label>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const y = new Date().getFullYear() - idx;
                    return (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <TaxSummaryView
              taxData={taxSummary}
              t={t}
              lang={lang}
              isLoading={taxLoading}
              isCalculating={calculateTaxesMutation.isPending}
              formatCurrency={formatCurrency}
              onCalculateTaxes={() => calculateTaxesMutation.mutate()}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t.createJobDialog.title}</DialogTitle>
            <DialogDescription>
              {t.createJobDialog.description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {t.createJobDialog.periodLabel}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {formatDate(dateRange.from, lang)} -{' '}
                          {formatDate(dateRange.to, lang)}
                        </>
                      ) : (
                        formatDate(dateRange.from, lang)
                      )
                    ) : (
                      <span>{t.createJobDialog.pickDateRange}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <div className="mb-2 flex gap-2">
                      <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap">
                          {t.createJobDialog.periodLabel} — {t.from || 'From'}
                        </Label>
                        <Select
                          value={String(
                            dateRange?.from
                              ? dateRange.from.getMonth()
                              : new Date().getMonth()
                          )}
                          onValueChange={(v) => {
                            const month = Number(v);
                            const year = dateRange?.from
                              ? dateRange.from.getFullYear()
                              : new Date().getFullYear();
                            const newFrom = new Date(year, month, 1);
                            setDateRange((prev) => ({
                              from: newFrom,
                              to:
                                prev?.to && prev.to >= newFrom
                                  ? prev.to
                                  : new Date(year, month + 1, 0),
                            }));
                          }}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }).map((_, i) => (
                              <SelectItem key={i} value={String(i)}>
                                {new Intl.DateTimeFormat(lang, {
                                  month: 'short',
                                }).format(new Date(2000, i, 1))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={String(
                            dateRange?.from
                              ? dateRange.from.getFullYear()
                              : new Date().getFullYear()
                          )}
                          onValueChange={(v) => {
                            const year = Number(v);
                            const month = dateRange?.from
                              ? dateRange.from.getMonth()
                              : new Date().getMonth();
                            const newFrom = new Date(year, month, 1);
                            setDateRange((prev) => ({
                              from: newFrom,
                              to:
                                prev?.to && prev.to >= newFrom
                                  ? prev.to
                                  : new Date(year, month + 1, 0),
                            }));
                          }}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 11 }).map((_, idx) => {
                              const y = new Date().getFullYear() - idx;
                              return (
                                <SelectItem key={y} value={String(y)}>
                                  {y}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap">
                          {t.to || 'To'}
                        </Label>
                        <Select
                          value={String(
                            dateRange?.to
                              ? dateRange.to.getMonth()
                              : new Date().getMonth()
                          )}
                          onValueChange={(v) => {
                            const month = Number(v);
                            const year = dateRange?.to
                              ? dateRange.to.getFullYear()
                              : new Date().getFullYear();
                            const newTo = new Date(year, month + 1, 0);
                            setDateRange((prev) => ({
                              from:
                                prev?.from && prev.from <= newTo
                                  ? prev.from
                                  : new Date(year, month, 1),
                              to: newTo,
                            }));
                          }}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }).map((_, i) => (
                              <SelectItem key={i} value={String(i)}>
                                {new Intl.DateTimeFormat(lang, {
                                  month: 'short',
                                }).format(new Date(2000, i, 1))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={String(
                            dateRange?.to
                              ? dateRange.to.getFullYear()
                              : new Date().getFullYear()
                          )}
                          onValueChange={(v) => {
                            const year = Number(v);
                            const month = dateRange?.to
                              ? dateRange.to.getMonth()
                              : new Date().getMonth();
                            const newTo = new Date(year, month + 1, 0);
                            setDateRange((prev) => ({
                              from:
                                prev?.from && prev.from <= newTo
                                  ? prev.from
                                  : new Date(year, month, 1),
                              to: newTo,
                            }));
                          }}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 11 }).map((_, idx) => {
                              const y = new Date().getFullYear() - idx;
                              return (
                                <SelectItem key={y} value={String(y)}>
                                  {y}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createJobMutation.isPending}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleCreateJob}
              disabled={
                createJobMutation.isPending ||
                !dateRange?.from ||
                !dateRange?.to
              }
            >
              {createJobMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.creating}
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {t.createJobDialog.submit}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
