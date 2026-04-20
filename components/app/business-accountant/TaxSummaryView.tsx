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
import type { TaxSummaryResponse } from '@/types/services';

interface TaxSummaryViewProps {
  taxData: TaxSummaryResponse['data'] | undefined;
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
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.annualVat}</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(
                taxData.summary.annual_vat_total,
                taxData.currency
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.corporateTax}</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(
                taxData.summary.annual_corporate_tax,
                taxData.currency
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.withholdingTax}</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(
                taxData.summary.annual_withholding_tax,
                taxData.currency
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalLiability}</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(
                taxData.summary.total_tax_liability,
                taxData.currency
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
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
                  taxData.vat_breakdown.standard_rate_19_percent,
                  taxData.currency
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">{t.reducedRate13}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  taxData.vat_breakdown.reduced_rate_13_percent,
                  taxData.currency
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">{t.reducedRate7}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  taxData.vat_breakdown.reduced_rate_7_percent,
                  taxData.currency
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
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
              {taxData.monthly_details.map((month) => (
                <TableRow key={month.month}>
                  <TableCell>{month.period}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(month.vat_total, taxData.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(month.corporate_tax_due, taxData.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(month.withholding_tax, taxData.currency)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(
                      month.total_tax_liability,
                      taxData.currency
                    )}
                  </TableCell>
                  <TableCell>{formatDate(month.due_date, lang)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
