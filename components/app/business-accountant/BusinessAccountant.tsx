'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { AccountantService } from '@/lib/services';
import { formatDate, dateToISOString } from '@/lib/date-utils';
import { JobResultsView } from './JobResultsView';
import { TaxSummaryView } from './TaxSummaryView';
import { Calendar } from '@/components/ui/calendar';
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

type AccountingJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface BusinessAccountantProps {
  businessId: string;
  lang: Locale;
  dictionary: Dictionary;
}

const statusIcons: Record<AccountingJobStatus, typeof Clock> = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
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

  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
  } = useQuery({
    queryKey: ['accountant-jobs', businessId],
    queryFn: () => AccountantService.listJobs(businessId),
    enabled: !!businessId,
    staleTime: 30 * 1000,
  });

  const { data: jobResults, isLoading: jobResultsLoading } = useQuery({
    queryKey: ['accountant-job-results', businessId, selectedJobId],
    queryFn: selectedJobId
      ? () => AccountantService.getJobResults(businessId, selectedJobId)
      : undefined,
    enabled: !!selectedJobId,
  });

  const { data: taxData, isLoading: taxLoading } = useQuery({
    queryKey: ['accountant-taxes', businessId],
    queryFn: () => AccountantService.getTaxes(businessId),
    enabled: !!businessId,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['accountant-health'],
    queryFn: () => AccountantService.health(),
  });

  const createJobMutation = useMutation({
    mutationFn: (data: { period_start: string; period_end: string }) =>
      AccountantService.createJob(businessId, {
        period_start: data.period_start,
        period_end: data.period_end,
      }),
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
      period_start: dateToISOString(dateRange.from),
      period_end: dateToISOString(dateRange.to),
    });
  };

  const jobs = useMemo(() => jobsData?.data || [], [jobsData]);
  const taxSummary = useMemo(() => taxData?.data, [taxData]);
  const selectedJobResults = useMemo(() => jobResults?.data, [jobResults]);
  const isServiceAvailable = healthData?.status === 'available';

  const renderStatusBadge = (status: AccountingJobStatus) => {
    const Icon = statusIcons[status];
    return (
      <Badge
        variant={status === 'completed' ? 'default' : 'secondary'}
        className="gap-1"
      >
        <Icon
          className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`}
        />
        {t.status[status]}
      </Badge>
    );
  };

  if (jobsError) {
    return (
      <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t.loadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
          {healthLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <Badge
              variant={isServiceAvailable ? 'default' : 'destructive'}
              className="gap-1"
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
                          key={job.task_id}
                          className="hover:bg-muted flex h-auto w-full cursor-pointer items-center justify-between rounded-lg border p-4 text-left transition-colors"
                          onClick={() => {
                            setSelectedJobId(job.task_id);
                            setActiveTab('overview');
                          }}
                        >
                          <div className="space-y-1">
                            <p className="font-medium">
                              {formatDate(job.period_start, lang)} -{' '}
                              {formatDate(job.period_end, lang)}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {job.journal_entries_count} {t.journalEntries} ·{' '}
                              {job.reports_generated} {t.reports}
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
              {jobsLoading ? (
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
                      <TableRow key={job.task_id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {formatDate(job.period_start, lang)} -{' '}
                              {formatDate(job.period_end, lang)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{renderStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <div className="w-full max-w-[100px]">
                            <Progress
                              value={job.progress_percent}
                              className="h-2"
                            />
                            <span className="text-muted-foreground text-xs">
                              {job.progress_percent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{job.journal_entries_count}</TableCell>
                        <TableCell className="text-right">
                          {job.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedJobId(job.task_id);
                                setActiveTab('overview');
                              }}
                            >
                              {t.viewResults}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes">
          <TaxSummaryView
            taxData={taxSummary}
            t={t}
            lang={lang}
            isLoading={taxLoading}
            formatCurrency={formatCurrency}
          />
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
