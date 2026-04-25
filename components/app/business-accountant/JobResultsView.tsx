'use client';

import {
  Calculator,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type { GetJobResultsResponseDto } from '@/types/services';

interface JobResultsViewProps {
  results: GetJobResultsResponseDto['results'] | undefined;
  t: Dictionary['pages']['businessAccountant'];
  lang: Locale;
  formatCurrency: (amount: number, currency?: string) => string;
  onClose: () => void;
}

export function JobResultsView({
  results,
  t,
  formatCurrency,
  lang,
  onClose,
}: JobResultsViewProps) {
  if (!results)
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.jobResultsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Calculator className="mx-auto mb-2 h-12 w-12 opacity-50" />
          <p className="text-muted-foreground">{t.noCompletedJobs}</p>
        </CardContent>
      </Card>
    );

  const {
    taskId,
    periodStart,
    periodEnd,
    totalRevenue,
    totalExpenses,
    netProfit,
    grossProfit,
    accountsReceivable,
    accountsPayable,
    cashPosition,
    taxCalculations,
    aiInsights,
    recommendations,
    anomaliesDetected,
    reports,
    journalEntriesPreview,
    totalJournalEntries,
  } = results;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t.jobResultsTitle}</h2>
          <p className="text-muted-foreground font-mono text-sm">{taskId}</p>
          {(periodStart || periodEnd) && (
            <p className="text-muted-foreground text-sm">
              {periodStart && formatDate(periodStart, lang)}
              {periodStart && periodEnd && ' - '}
              {periodEnd && formatDate(periodEnd, lang)}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          {t.close}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {t.totalRevenue}
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(totalRevenue ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-yellow-500" />
              {t.grossProfit}
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(grossProfit ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              {t.totalExpenses}
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(totalExpenses ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              {t.netProfit}
            </CardDescription>
            <CardTitle
              className={cn(
                'text-2xl',
                (netProfit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatCurrency(netProfit ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.totalJournalEntries}</CardDescription>
          <CardTitle className="text-2xl">
            {String(totalJournalEntries ?? 0)}
          </CardTitle>
        </CardHeader>
      </Card>

      {(accountsReceivable !== undefined ||
        accountsPayable !== undefined ||
        cashPosition !== undefined) && (
        <div className="grid gap-4 sm:grid-cols-3">
          {accountsReceivable !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Receipt className="h-4 w-4 text-orange-500" />
                  {t.accountsReceivable}
                </CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(accountsReceivable)}
                </CardTitle>
              </CardHeader>
            </Card>
          )}
          {accountsPayable !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  {t.accountsPayable}
                </CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(accountsPayable)}
                </CardTitle>
              </CardHeader>
            </Card>
          )}
          {cashPosition !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  {t.cashPosition}
                </CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(cashPosition)}
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </div>
      )}

      {aiInsights && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t.aiInsights}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {aiInsights}
            </p>
          </CardContent>
        </Card>
      )}

      {taxCalculations && taxCalculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.taxCalculations}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.taxType}</TableHead>
                    <TableHead>{t.jurisdiction}</TableHead>
                    <TableHead className="text-right">{t.taxable}</TableHead>
                    <TableHead className="text-right">{t.rate}</TableHead>
                    <TableHead className="text-right">{t.amount}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxCalculations.map((tc, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{tc.taxType}</TableCell>
                      <TableCell>{tc.jurisdiction}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(tc.taxableAmount ?? 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {((tc.taxRate ?? 0) * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(tc.taxAmount ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {anomaliesDetected && anomaliesDetected.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t.anomalies}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {anomaliesDetected.map((anomaly, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span
                    className={cn(
                      'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                      anomaly.severity === 'high'
                        ? 'bg-red-500'
                        : anomaly.severity === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                    )}
                  />
                  <div>
                    <span className="font-medium">{anomaly.type}:</span>{' '}
                    <span className="text-muted-foreground">
                      {anomaly.description}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {reports && reports.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.reports}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reports.map((report, idx) => (
                <li key={idx} className="rounded-md border p-3">
                  <p className="font-medium capitalize">
                    {report.reportType.replaceAll('_', ' ')}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(report.periodStart, lang)} -{' '}
                    {formatDate(report.periodEnd, lang)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {journalEntriesPreview && journalEntriesPreview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.journalEntriesPreview}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.date}</TableHead>
                    <TableHead>{t.descriptionColumn}</TableHead>
                    <TableHead className="text-right">{t.debit}</TableHead>
                    <TableHead className="text-right">{t.credit}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntriesPreview.map((je, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {je.date ? formatDate(je.date, lang) : '-'}
                      </TableCell>
                      <TableCell>
                        {je.description}
                        {je.account && (
                          <span className="text-muted-foreground ml-1 text-xs">
                            ({je.account})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {je.debit === undefined
                          ? '-'
                          : formatCurrency(je.debit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {je.credit === undefined
                          ? '-'
                          : formatCurrency(je.credit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t.recommendations}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
