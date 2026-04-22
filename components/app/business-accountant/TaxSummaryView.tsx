'use client';

import { Calculator } from 'lucide-react';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { formatDate } from '@/lib/date-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TaxSummaryResponse, TaxSummaryWrapper } from '@/types/services';

interface TaxSummaryViewProps {
  // Accept either the wrapped API response or the unwrapped TaxSummaryResponse
  taxData: TaxSummaryResponse | TaxSummaryWrapper | undefined;
  t: Dictionary['pages']['businessAccountant'];
  lang: Locale;
  isLoading: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
}

export function TaxSummaryView({
  taxData,
  t,
  lang,
  isLoading,
  formatCurrency,
}: TaxSummaryViewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (!taxData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Calculator className="mx-auto mb-2 h-12 w-12 opacity-50" />
          <p className="text-muted-foreground">{t.noTaxData}</p>
        </CardContent>
      </Card>
    );
  }

  const normalized: TaxSummaryResponse =
    taxData && 'data' in taxData && (taxData as TaxSummaryWrapper).data
      ? (taxData as TaxSummaryWrapper).data
      : (taxData as TaxSummaryResponse);

  const currency = normalized.currency || 'TND';
  const summary = normalized.summary || {};
  const vatBreakdown = normalized.vat_breakdown || {};
  const monthlyDetails = normalized.monthly_details || [];
  const taxCalendar = normalized.tax_calendar || [];

  return (
    <div className="space-y-4">
      {/* Tax Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.annualVat}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.annual_vat_total ?? 0, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.corporateTax}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.annual_corporate_tax ?? 0, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.withholdingTax}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.annual_withholding_tax ?? 0, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalLiability}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.total_tax_liability ?? 0, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* VAT Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t.vatBreakdown}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">
                {t.standardRate19}
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  vatBreakdown.standard_rate_19_percent ?? 0,
                  currency
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">{t.reducedRate13}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  vatBreakdown.reduced_rate_13_percent ?? 0,
                  currency
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">{t.reducedRate7}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  vatBreakdown.reduced_rate_7_percent ?? 0,
                  currency
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Calendar */}
      {taxCalendar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.taxCalendar}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.periodColumn}</TableHead>
                  <TableHead>{t.descriptionColumn}</TableHead>
                  <TableHead>{t.dueColumn}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxCalendar.map((item, idx) => {
                  const periodDisplay = item?.period ?? '';
                  const descriptionDisplay = item?.description ?? '';
                  const dueDisplay = item?.due_date
                    ? formatDate(item.due_date, lang)
                    : '';
                  return (
                    <TableRow key={idx}>
                      <TableCell>{periodDisplay}</TableCell>
                      <TableCell>{descriptionDisplay}</TableCell>
                      <TableCell>{dueDisplay}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Monthly Details */}
      {monthlyDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.monthlyDetails}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.monthColumn}</TableHead>
                  <TableHead className="text-right">{t.vatColumn}</TableHead>
                  <TableHead className="text-right">
                    {t.corporateTaxShort}
                  </TableHead>
                  <TableHead className="text-right">
                    {t.withholdingTaxShort}
                  </TableHead>
                  <TableHead className="text-right">{t.totalColumn}</TableHead>
                  <TableHead>{t.dueColumn}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyDetails.map((month, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{month?.period ?? ''}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.vat_total ?? 0, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.corporate_tax_due ?? 0, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.withholding_tax ?? 0, currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(month.total_tax_liability ?? 0, currency)}
                    </TableCell>
                    <TableCell>
                      {month?.due_date ? formatDate(month.due_date, lang) : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
