'use client';

import {
  Calculator,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  TrendingUp,
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
import type {
  GetAccountingJobResultsResponse,
  GetAccountingJobResultsWrapper,
} from '@/types/services';

interface JobResultsViewProps {
  // Accept either the wrapped API response (`{ success, data }`) or the
  // unwrapped `GetAccountingJobResultsResponse` and normalize below.
  results:
    | GetAccountingJobResultsResponse
    | GetAccountingJobResultsWrapper
    | undefined;
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

  const normalized: GetAccountingJobResultsResponse =
    results &&
    'data' in results &&
    (results as GetAccountingJobResultsWrapper).data
      ? (results as GetAccountingJobResultsWrapper).data
      : (results as GetAccountingJobResultsResponse);

  const {
    task_id,
    total_revenue,
    total_expenses,
    net_profit,
    ai_insights,
    recommendations,
  } = normalized;

  const {
    gross_profit,
    tax_calculations,
    anomalies_detected,
    reports,
    journal_entries_preview,
    total_journal_entries,
    completed_at,
  } = normalized;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t.jobResultsTitle}</h2>
          <p className="text-muted-foreground font-mono text-sm">{task_id}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          {t.close}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {t.totalRevenue}
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(total_revenue ?? 0)}
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
              {formatCurrency(gross_profit ?? 0)}
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
              {formatCurrency(total_expenses ?? 0)}
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
                (net_profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatCurrency(net_profit ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      {/* Additional summaries */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t.totalJournalEntries}</CardDescription>
            <CardTitle className="text-2xl">
              {String(total_journal_entries ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t.statusLabel}</CardDescription>
            <CardTitle className="text-2xl">
              {t.status[normalized.status as keyof typeof t.status] ??
                normalized.status}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t.completedAt}</CardDescription>
            <CardTitle className="text-2xl">
              {completed_at ? formatDate(completed_at, lang) : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      {ai_insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t.aiInsights}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {ai_insights}
            </p>
          </CardContent>
        </Card>
      )}

      {tax_calculations && tax_calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.taxCalculations}</CardTitle>
          </CardHeader>
          <CardContent>
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
                {tax_calculations.map((tc, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{tc.tax_type}</TableCell>
                    <TableCell>{tc.jurisdiction}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(tc.taxable_amount ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(tc.tax_rate * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(tc.tax_amount ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {anomalies_detected && anomalies_detected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.anomalies}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {anomalies_detected.map((an, idx) => (
                <li key={idx} className="flex flex-col">
                  <span className="font-medium">
                    {an.type} — {an.severity}
                  </span>
                  <span className="text-muted-foreground">
                    {an.description}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {reports && reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.reports}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {reports.map((r, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.report_type}</div>
                    <div className="text-muted-foreground text-sm">
                      {formatDate(r.generated_at, lang)}
                    </div>
                  </div>
                  {r.download_url ? (
                    <a
                      href={r.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary"
                    >
                      {t.download}
                    </a>
                  ) : undefined}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {journal_entries_preview && journal_entries_preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.journalEntriesPreview}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.date}</TableHead>
                  <TableHead>{t.account}</TableHead>
                  <TableHead className="text-right">{t.debit}</TableHead>
                  <TableHead className="text-right">{t.credit}</TableHead>
                  <TableHead>{t.descriptionColumn}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journal_entries_preview.map((je, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(je.date, lang)}</TableCell>
                    <TableCell>{je.account}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(je.debit ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(je.credit ?? 0)}
                    </TableCell>
                    <TableCell>{je.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.recommendations}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
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
