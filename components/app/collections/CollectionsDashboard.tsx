/* eslint-disable */
'use client';

import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CollectionsService } from '@/lib/services/collections';
import type {
  CollectionsDashboard as CollectionsDashboardData,
  InvoiceRiskScore,
  RiskLevel,
  GenerateReminderResponse,
} from '@/types/services';
import { type Dictionary } from '@/get-dictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
};

const RISK_BAR_COLORS: Record<RiskLevel, string> = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-600',
};

const RISK_ICONS: Record<RiskLevel, React.ReactNode> = {
  LOW: <CheckCircle className="h-4 w-4 text-green-600" />,
  MEDIUM: <Clock className="h-4 w-4 text-yellow-600" />,
  HIGH: <AlertCircle className="h-4 w-4 text-orange-600" />,
  CRITICAL: <AlertTriangle className="h-4 w-4 text-red-600" />,
};

const getRiskLabels = (d: Dictionary['pages']['collections']) => ({
  LOW: d.riskLow,
  MEDIUM: d.riskMedium,
  HIGH: d.riskHigh,
  CRITICAL: d.riskCritical,
});

function RiskBar({ score, level }: { score: number; level: RiskLevel }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full transition-all ${RISK_BAR_COLORS[level]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-7 text-right text-xs font-medium tabular-nums">
        {score}
      </span>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
        </div>
        <div className="bg-muted rounded-md p-2">{icon}</div>
      </CardContent>
    </Card>
  );
}

function ReminderDialog({
  invoiceId,
  businessId,
  invoiceNumber,
  onClose,
  dictionary,
}: {
  invoiceId: string;
  businessId: string;
  invoiceNumber: string;
  onClose: () => void;
  dictionary: Dictionary['pages']['collections'];
}) {
  const [copied, setCopied] = useState(false);
  const RISK_LABELS = getRiskLabels(dictionary);

  const { data, isPending, error } = useQuery<GenerateReminderResponse>({
    queryKey: ['collections-reminder', invoiceId, businessId],
    queryFn: () => CollectionsService.generateReminder(invoiceId, businessId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error_) {
      console.error('Failed to copy to clipboard:', error_);
      toast.error(dictionary.copyFailed || 'Failed to copy to clipboard');
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {dictionary.dialogTitle.replace('{number}', invoiceNumber)}
          </DialogTitle>
        </DialogHeader>

        {isPending && (
          <div className="space-y-3 py-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error instanceof Error ? error.message : dictionary.dialogError}
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={RISK_COLORS[data.riskLevel]}>
                {RISK_ICONS[data.riskLevel]}
                <span className="ml-1">
                  {dictionary.riskLabel.replace(
                    '{level}',
                    RISK_LABELS[data.riskLevel]
                  )}
                </span>
              </Badge>
            </div>

            <div>
              <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                {dictionary.subject}
              </p>
              <div className="bg-muted/40 rounded-md border p-3 text-sm font-medium">
                {data.subject}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {dictionary.messageBody}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={() => handleCopy(data.reminderMessage)}
                >
                  <Copy className="h-3 w-3" />
                  {copied ? dictionary.copied : dictionary.copy}
                </Button>
              </div>
              <pre className="bg-muted/40 rounded-md border p-3 text-sm leading-relaxed whitespace-pre-wrap">
                {data.reminderMessage}
              </pre>
            </div>

            {data.recommendedAction && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <strong>{dictionary.recommendedAction}:</strong>{' '}
                {data.recommendedAction}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <DialogClose asChild>
                <Button variant="outline" onClick={onClose}>
                  {dictionary.close}
                </Button>
              </DialogClose>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CollectionsDashboard({
  businessId,
  dictionary,
}: {
  businessId: string;
  dictionary: Dictionary;
}) {
  const d = dictionary.pages.collections;
  const RISK_LABELS = getRiskLabels(d);
  const [filterLevel, setFilterLevel] = useState<RiskLevel | 'ALL'>('ALL');
  const [expandedRow, setExpandedRow] = useState<string | undefined>();
  const [reminderInvoice, setReminderInvoice] = useState<
    | {
        id: string;
        number: string;
      }
    | undefined
  >();

  const { data, isLoading, error, refetch } =
    useQuery<CollectionsDashboardData>({
      queryKey: ['collections-dashboard', businessId],
      queryFn: () => CollectionsService.getDashboard(businessId),
      staleTime: 2 * 60 * 1000,
    });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : d.errorLoading}
        </p>
        <Button variant="outline" onClick={() => void refetch()}>
          {d.retry}
        </Button>
      </div>
    );
  }

  const filteredScores: InvoiceRiskScore[] =
    filterLevel === 'ALL'
      ? data.scores
      : data.scores.filter((s) => s.riskLevel === filterLevel);

  const criticalAmount = data.amountByRisk.CRITICAL + data.amountByRisk.HIGH;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{d.title}</h1>
          <p className="text-muted-foreground text-sm">{d.description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          {d.refresh}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title={d.statTotalOutstanding}
          value={data.totalOpenInvoices}
          sub={d.statInvoices}
          icon={<TrendingUp className="text-muted-foreground h-5 w-5" />}
        />
        <StatCard
          title={d.statTotalOverdue}
          value={`${data.totalOutstandingAmount.toLocaleString('fr-FR')} ${data.currency}`}
          sub={d.statInvoices}
          icon={<AlertCircle className="text-muted-foreground h-5 w-5" />}
        />
        <StatCard
          title={d.statHighRiskCount}
          value={data.riskBreakdown.HIGH + data.riskBreakdown.CRITICAL}
          sub={`${criticalAmount.toLocaleString('fr-FR')} ${data.currency}`}
          icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          title={d.statLowRiskCount}
          value={data.riskBreakdown.LOW}
          sub={`${data.amountByRisk.LOW.toLocaleString('fr-FR')} ${data.currency}`}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{d.chartTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-5 w-full overflow-hidden rounded-full">
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as RiskLevel[]).map(
              (level) => {
                const count = data.riskBreakdown[level];
                const pct =
                  data.totalOpenInvoices > 0
                    ? (count / data.totalOpenInvoices) * 100
                    : 0;
                if (pct === 0) return;
                return (
                  <div
                    key={level}
                    className={`${RISK_BAR_COLORS[level]} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${RISK_LABELS[level]}: ${count}`}
                  />
                );
              }
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as RiskLevel[]).map(
              (level) => (
                <button
                  key={level}
                  className={`flex items-center gap-1.5 text-sm transition-opacity ${filterLevel !== 'ALL' && filterLevel !== level ? 'opacity-40' : ''}`}
                  onClick={() =>
                    setFilterLevel(filterLevel === level ? 'ALL' : level)
                  }
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${RISK_BAR_COLORS[level]}`}
                  />
                  <span className="font-medium">{RISK_LABELS[level]}</span>
                  <span className="text-muted-foreground">
                    ({data.riskBreakdown[level]})
                  </span>
                </button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {d.chartTitle}
              {filterLevel !== 'ALL' && (
                <Badge className={`ml-2 ${RISK_COLORS[filterLevel]}`}>
                  {RISK_LABELS[filterLevel]}
                </Badge>
              )}
            </CardTitle>
            <span className="text-muted-foreground text-sm">
              {d.invoiceCount.replace('{count}', String(filteredScores.length))}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredScores.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <p>{d.emptyState}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d.columnInvoice}</TableHead>
                  <TableHead>{d.columnClient}</TableHead>
                  <TableHead>{d.columnAmount}</TableHead>
                  <TableHead>{d.columnOverdue}</TableHead>
                  <TableHead>{d.columnScore}</TableHead>
                  <TableHead>{d.columnLevel}</TableHead>
                  <TableHead className="text-right">
                    {d.columnActions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScores.map((score) => (
                  <Fragment key={score.invoiceId}>
                    <TableRow
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() =>
                        setExpandedRow(
                          expandedRow === score.invoiceId
                            ? undefined
                            : score.invoiceId
                        )
                      }
                    >
                      <TableCell className="font-medium">
                        {score.invoiceNumber}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm">
                        {score.recipientLabel}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {score.outstandingAmount.toLocaleString('fr-FR')}{' '}
                        <span className="text-muted-foreground">
                          {score.currency}
                        </span>
                      </TableCell>
                      <TableCell>
                        {score.daysOverdue > 0 ? (
                          <span className="text-sm font-medium text-red-600">
                            {d.daysOverdue.replace(
                              '{days}',
                              String(score.daysOverdue)
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {d.upcoming}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RiskBar
                          score={score.riskScore}
                          level={score.riskLevel}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`gap-1 ${RISK_COLORS[score.riskLevel]}`}
                        >
                          {RISK_ICONS[score.riskLevel]}
                          {RISK_LABELS[score.riskLevel]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReminderInvoice({
                                id: score.invoiceId,
                                number: score.invoiceNumber,
                              });
                            }}
                          >
                            <Sparkles className="h-3 w-3 text-purple-500" />
                            {d.aiReminder}
                          </Button>
                          {expandedRow === score.invoiceId ? (
                            <ChevronUp className="text-muted-foreground h-4 w-4" />
                          ) : (
                            <ChevronDown className="text-muted-foreground h-4 w-4" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {expandedRow === score.invoiceId && (
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={7} className="py-3">
                          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                            <div>
                              <p className="text-muted-foreground text-xs">
                                {d.dueDate}
                              </p>
                              <p className="font-medium">
                                {new Date(score.dueDate).toLocaleDateString(
                                  'fr-FR'
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">
                                {d.paymentHistory}
                              </p>
                              <p className="font-medium">
                                {d.invoiceCount.replace(
                                  '{count}',
                                  String(score.historyCount)
                                )}
                              </p>
                            </div>
                            {score.avgHistoricalDelayDays !== undefined && (
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  {d.avgPaymentDelay}
                                </p>
                                <p className="font-medium">
                                  {d.days.replace(
                                    '{days}',
                                    String(
                                      Math.round(score.avgHistoricalDelayDays)
                                    )
                                  )}
                                </p>
                              </div>
                            )}
                            {score.clientLatePaymentRate !== undefined && (
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  {d.latePaymentRate}
                                </p>
                                <p className="font-medium">
                                  {Math.round(
                                    score.clientLatePaymentRate * 100
                                  )}
                                  %
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {reminderInvoice && (
        <ReminderDialog
          invoiceId={reminderInvoice.id}
          businessId={businessId}
          invoiceNumber={reminderInvoice.number}
          onClose={() => setReminderInvoice(undefined)}
          dictionary={d}
        />
      )}
    </div>
  );
}
