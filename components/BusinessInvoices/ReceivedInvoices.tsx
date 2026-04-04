'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  AlertCircle,
  Briefcase,
  X,
  Eye,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { InvoicesService } from '@/lib/requests';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type { InvoiceStatus } from '@/types/ResponseInterfaces';

type FilterStatus = 'ALL' | InvoiceStatus;

const STATUS_ICONS: Record<InvoiceStatus, React.ReactNode> = {
  DRAFT: <Clock className="h-4 w-4" />,
  ISSUED: <FileText className="h-4 w-4" />,
  VIEWED: <Eye className="h-4 w-4" />,
  PAID: <CheckCircle className="h-4 w-4" />,
  PARTIAL: <AlertCircle className="h-4 w-4" />,
  OVERDUE: <AlertCircle className="h-4 w-4" />,
  DISPUTED: <AlertCircle className="h-4 w-4" />,
  VOIDED: <AlertCircle className="h-4 w-4" />,
  ARCHIVED: <FileText className="h-4 w-4" />,
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  ISSUED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  VIEWED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  PARTIAL:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  DISPUTED:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  VOIDED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
};

export function ReceivedInvoices({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const t = dictionary.pages.invoices;
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: invoicesResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['invoices-received-business'],
    queryFn: () => InvoicesService.getReceivedInvoicesByBusiness(),
  });

  const invoices = useMemo(
    () => invoicesResponse?.receipts ?? [],
    [invoicesResponse?.receipts]
  );

  const filteredInvoices = useMemo(() => {
    let results = invoices;

    if (filterStatus !== 'ALL') {
      results = results.filter((inv) => inv.invoiceStatus === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      results = results.filter((inv) => {
        const searchFields = [
          inv.invoiceNumber,
          inv.issuerBusinessName,
          inv.totalAmount.toString(),
        ].map((f) => (f ? f.toLowerCase() : ''));
        return searchFields.some((field) => field.includes(query));
      });
    }

    return results;
  }, [invoices, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    let paid = 0;
    let pending = 0;

    for (const inv of invoices) {
      if (inv.invoiceStatus === 'PAID' || inv.invoiceStatus === 'ARCHIVED') {
        paid += inv.totalAmount;
      }
      if (
        inv.invoiceStatus === 'ISSUED' ||
        inv.invoiceStatus === 'VIEWED' ||
        inv.invoiceStatus === 'PARTIAL' ||
        inv.invoiceStatus === 'OVERDUE'
      ) {
        pending += inv.totalAmount;
      }
    }

    return {
      total: invoices.length,
      paid,
      pending,
    };
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t.receivedInvoices}
        </h1>
        <p className="text-muted-foreground">{t.receivedInvoicesDescription}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t.totalInvoices}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? '—' : stats.total}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>

        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t.totalPaid}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading
                ? '—'
                : `${stats.paid.toLocaleString(lang, {
                    minimumFractionDigits: 2,
                  })}`}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>

        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t.totalPending}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading
                ? '—'
                : `${stats.pending.toLocaleString(lang, {
                    minimumFractionDigits: 2,
                  })}`}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Invoice List</CardTitle>
            <CardDescription>
              {isLoading
                ? '...'
                : `${filteredInvoices.length} ${filteredInvoices.length === 1 ? 'invoice' : 'invoices'}`}
            </CardDescription>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              disabled={isFetching}
              className="pr-10"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filterStatus === 'ALL' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('ALL')}
              disabled={isFetching}
            >
              {t.filterAll}
            </Button>
            {(['ISSUED', 'PAID', 'OVERDUE', 'PARTIAL'] as const).map(
              (status) => {
                const statusLabel =
                  status === 'ISSUED'
                    ? t.filterIssued
                    : status === 'PAID'
                      ? t.filterPaid
                      : status === 'OVERDUE'
                        ? t.filterOverdue
                        : t.filterPartial;

                return (
                  <Button
                    key={status}
                    size="sm"
                    variant={filterStatus === status ? 'default' : 'outline'}
                    onClick={() => setFilterStatus(status)}
                    disabled={isFetching}
                  >
                    {statusLabel}
                  </Button>
                );
              }
            )}
          </div>
        </CardHeader>

        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              {searchQuery ? (
                <>
                  <FileText className="text-muted-foreground h-12 w-12" />
                  <div>
                    <p className="text-foreground font-medium">{t.noResults}</p>
                  </div>
                </>
              ) : (
                <>
                  <Briefcase className="text-muted-foreground h-12 w-12" />
                  <div>
                    <p className="text-foreground font-medium">
                      {t.noInvoices}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t.noReceivedInvoicesHint}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Viewed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.issuerBusinessName}
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.totalAmount.toLocaleString(lang, {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {invoice.currency}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[invoice.invoiceStatus]}>
                        <span className="mr-1">
                          {STATUS_ICONS[invoice.invoiceStatus]}
                        </span>
                        {invoice.invoiceStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invoice.issuedDate).toLocaleDateString(lang)}
                    </TableCell>
                    <TableCell>
                      {invoice.recipientViewed ? (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground text-sm">
                            {invoice.recipientViewedAt
                              ? new Date(
                                  invoice.recipientViewedAt
                                ).toLocaleDateString(lang)
                              : 'Yes'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
