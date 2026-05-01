'use client';

import { Calculator, Loader2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TunisianTaxSummaryResponseDto } from '@/types/services';

interface TaxSummaryViewProps {
  taxData: TunisianTaxSummaryResponseDto['taxes'] | undefined;
  t: Dictionary['pages']['businessAccountant'];
  lang: Locale;
  isLoading: boolean;
  isCalculating?: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  onCalculateTaxes?: () => void;
}

export function TaxSummaryView({
  taxData,
  t,
  lang,
  isLoading,
  isCalculating,
  formatCurrency,
  onCalculateTaxes,
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
          {onCalculateTaxes && (
            <Button
              onClick={onCalculateTaxes}
              disabled={isCalculating}
              className="mt-4"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.calculating}
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  {t.calculateTaxes}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const currency = taxData.currency ?? 'TND';
  const summary = taxData.summary ?? {};
  const vatBreakdown = taxData.vatBreakdown ?? {};
  const monthlyDetails = taxData.monthlyDetails ?? [];
  const taxCalendar = taxData.taxCalendar ?? [];

  return (
    <div className="space-y-4">
      {/* Tax Summary Header with Recalculate */}
      {onCalculateTaxes && (
        <div className="flex items-center justify-end">
          <Button
            onClick={onCalculateTaxes}
            disabled={isCalculating}
            variant="outline"
            size="sm"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.calculating}
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                {t.calculateTaxes}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Tax Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.annualVat}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.annualVatTotal ?? 0, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.corporateTax}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.annualCorporateTax ?? 0, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.withholdingTax}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.annualWithholdingTax ?? 0, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalLiability}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.totalTaxLiability ?? 0, currency)}
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
                  vatBreakdown.standardRate19Percent ?? 0,
                  currency
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">{t.reducedRate13}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  vatBreakdown.reducedRate13Percent ?? 0,
                  currency
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">{t.reducedRate7}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  vatBreakdown.reducedRate7Percent ?? 0,
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.periodColumn}</TableHead>
                    <TableHead>{t.descriptionColumn}</TableHead>
                    <TableHead>{t.dueColumn}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxCalendar.map((item, idx) => (
                    <TableRow key={item.period ?? idx}>
                      <TableCell>{item.period}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        {item.dueDate ? formatDate(item.dueDate, lang) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
            <div className="rounded-md border">
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
                    <TableHead className="text-right">
                      {t.totalColumn}
                    </TableHead>
                    <TableHead>{t.dueColumn}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyDetails.map((month, idx) => (
                    <TableRow key={month.month ?? month.period ?? idx}>
                      <TableCell>{month.period}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(month.vatTotal ?? 0, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(month.corporateTaxDue ?? 0, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(month.withholdingTax ?? 0, currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(month.totalTaxLiability ?? 0, currency)}
                      </TableCell>
                      <TableCell>
                        {month.dueDate ? formatDate(month.dueDate, lang) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
