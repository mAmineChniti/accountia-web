'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
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
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { formatDate } from '@/lib/date-utils';
import { InvoicesService } from '@/lib/requests';
import type {
  ReceivedInvoiceListResponse,
  InvoiceStatus,
  InvoiceReceiptResponseDto,
} from '@/types/services';
import { localizeErrorMessage } from '@/lib/error-localization';

type FilterStatus = 'ALL' | InvoiceStatus;

const STATUS_ICONS: Record<InvoiceStatus, React.ReactNode> = {
  DRAFT: <Clock className="h-4 w-4" />,
  ISSUED: <FileText className="h-4 w-4" />,
  VIEWED: <Eye className="h-4 w-4" />,
  PAID: <CheckCircle className="h-4 w-4" />,
  PARTIAL: <AlertCircle className="h-4 w-4" />,
  OVERDUE: <AlertCircle className="h-4 w-4" />,
  DISPUTED: <XCircle className="h-4 w-4" />,
  VOIDED: <XCircle className="h-4 w-4" />,
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

const getStatusLabel = (
  status: InvoiceStatus,
  dictionary: Dictionary
): string => {
  const d = dictionary.pages.invoices;
  const statusMap: Record<InvoiceStatus, string> = {
    DRAFT: d.statusDraft,
    ISSUED: d.statusIssued,
    VIEWED: d.statusViewed,
    PAID: d.statusPaid,
    PARTIAL: d.statusPartial,
    OVERDUE: d.statusOverdue,
    DISPUTED: d.statusDisputed,
    VOIDED: d.statusVoided,
    ARCHIVED: d.statusArchived,
  };
  return statusMap[status] || status;
};

export default function Invoices({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const t = dictionary.pages.invoices;
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<
    InvoiceReceiptResponseDto | undefined
  >();
  const pageSize = 10;

  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<ReceivedInvoiceListResponse>({
    queryKey: ['received-invoices', currentPage, pageSize, filterStatus],
    queryFn: () =>
      InvoicesService.getReceivedInvoicesByIndividual({
        page: currentPage,
        limit: pageSize,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
  });

  const invoices = useMemo(
    () => invoicesData?.receipts ?? [],
    [invoicesData?.receipts]
  );

  // Filter by search query
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;

    const query = searchQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      const searchFields = [
        inv.invoiceNumber,
        inv.issuerBusinessName,
        inv.issuerTenantDatabaseName,
        inv.totalAmount.toString(),
      ].map((f) => (f ? f.toLowerCase() : ''));

      return searchFields.some((field) => field.includes(query));
    });
  }, [invoices, searchQuery]);

  const stats = useMemo(() => {
    if (!invoicesData) {
      return { total: 0, paid: 0, pending: 0 };
    }

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
      total: invoicesData.total,
      paid,
      pending,
    };
  }, [invoicesData, invoices]);

  const errorMessage = error
    ? localizeErrorMessage(error, dictionary, t.fetchError)
    : undefined;

  const totalPages = invoicesData?.totalPages ?? 1;
  const isOverdue = (invoice: InvoiceReceiptResponseDto): boolean => {
    return invoice.invoiceStatus === 'OVERDUE';
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/${lang}/business-application`}>
              {t.createBusinessButton}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isFetching}
            onClick={() => refetch()}
            size="sm"
          >
            {isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.refresh}
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t.refresh}
              </>
            )}
          </Button>
        </div>
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
            <CardTitle>{t.invoiceList}</CardTitle>
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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
                onClick={handleClearSearch}
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
              onClick={() => handleStatusFilter('ALL')}
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
                    onClick={() => handleStatusFilter(status)}
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
          {errorMessage ? (
            <div className="space-y-3">
              <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-3">
                <AlertCircle className="h-5 w-5" />
                <div className="text-sm">{errorMessage}</div>
              </div>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                {t.retry}
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
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
                      {t.noInvoicesHint}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.columnInvoiceNumber}</TableHead>
                    <TableHead>{t.columnFrom}</TableHead>
                    <TableHead>{t.columnAmount}</TableHead>
                    <TableHead>{t.columnStatus}</TableHead>
                    <TableHead>{t.columnDueDate}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className={`cursor-pointer transition-colors ${
                        isOverdue(invoice)
                          ? 'bg-destructive/5 hover:bg-destructive/10'
                          : invoice.recipientViewed
                            ? 'hover:bg-muted/50'
                            : 'hover:bg-muted/50 font-medium'
                      }`}
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <TableCell>
                        <span className="font-medium">
                          {invoice.invoiceNumber}
                        </span>
                        {!invoice.recipientViewed && (
                          <span className="mx-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </TableCell>
                      <TableCell>{invoice.issuerBusinessName}</TableCell>
                      <TableCell className="font-medium">
                        {invoice.totalAmount.toLocaleString(lang, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {invoice.currency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[invoice.invoiceStatus]}
                        >
                          <span className="mr-1">
                            {STATUS_ICONS[invoice.invoiceStatus]}
                          </span>
                          {getStatusLabel(invoice.invoiceStatus, dictionary)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          isOverdue(invoice)
                            ? 'text-destructive font-medium'
                            : ''
                        }
                      >
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-muted-foreground text-sm">
                  {t.pagination
                    .replace('{page}', currentPage.toString())
                    .replace('{totalPages}', totalPages.toString())}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isFetching}
                  >
                    {t.previous}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages || isFetching}
                  >
                    {t.next}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog
        open={!!selectedInvoice}
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(undefined);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader className="space-y-4">
                <div className="space-y-2">
                  <DialogTitle className="text-2xl">
                    {selectedInvoice.invoiceNumber}
                  </DialogTitle>
                  <DialogDescription>
                    {t.columnFrom}: {selectedInvoice.issuerBusinessName}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status Section */}
                <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                  <div className="text-muted-foreground text-sm font-medium">
                    {t.columnStatus}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[selectedInvoice.invoiceStatus]}
                    >
                      <span className="mr-1">
                        {STATUS_ICONS[selectedInvoice.invoiceStatus]}
                      </span>
                      {getStatusLabel(
                        selectedInvoice.invoiceStatus,
                        dictionary
                      )}
                    </Badge>
                    {selectedInvoice.recipientViewed && (
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Eye className="h-4 w-4" />
                        {t.viewed}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm font-medium">
                      {t.columnAmount}
                    </div>
                    <div className="text-2xl font-bold">
                      {selectedInvoice.totalAmount.toLocaleString(lang, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {selectedInvoice.currency}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm font-medium">
                      {t.paymentStatus}
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {selectedInvoice.invoiceStatus === 'PAID'
                        ? `${t.statusPaid}`
                        : selectedInvoice.invoiceStatus === 'PARTIAL'
                          ? `${t.statusPartial}`
                          : `${t.statusPending}`}
                    </div>
                  </div>
                </div>

                {/* Dates Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm font-medium">
                      {t.columnIssuedDate}
                    </div>
                    <div className="font-medium">
                      {formatDate(selectedInvoice.issuedDate)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm font-medium">
                      {t.columnDueDate}
                    </div>
                    <div
                      className={
                        isOverdue(selectedInvoice)
                          ? 'text-destructive font-medium'
                          : 'font-medium'
                      }
                    >
                      {formatDate(selectedInvoice.dueDate)}
                      {isOverdue(selectedInvoice) && (
                        <span className="ml-2 text-xs">
                          ({t.statusOverdue})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Issuer Details */}
                <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                  <div className="text-muted-foreground text-sm font-medium">
                    {t.columnFrom}
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {selectedInvoice.issuerBusinessName}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {selectedInvoice.issuerTenantDatabaseName}
                    </div>
                  </div>
                </div>

                {/* Sync Information */}
                <div className="text-muted-foreground space-y-2 border-t pt-4 text-xs">
                  <div>
                    {t.lastSynced}: {formatDate(selectedInvoice.lastSyncedAt)}
                  </div>
                  {selectedInvoice.recipientViewedAt && (
                    <div>
                      {t.viewedAt}:{' '}
                      {formatDate(selectedInvoice.recipientViewedAt)}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInvoice(undefined)}
                    className="flex-1"
                  >
                    {t.close}
                  </Button>
                  <Button variant="default" className="flex-1">
                    {t.viewButton}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
