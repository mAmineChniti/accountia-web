'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  Dialog,
  DialogContent,
  DialogDescription,
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
import type {
  InvoiceStatus,
  InvoiceResponse,
} from '@/types/ResponseInterfaces';

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

export function IssuedInvoices({
  lang,
  dictionary,
  businessId,
}: {
  lang: Locale;
  dictionary: Dictionary;
  businessId: string;
}) {
  const t = dictionary.pages.invoices;
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<
    string | undefined
  >();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const {
    data: invoicesResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['invoices-issued', businessId],
    queryFn: () => InvoicesService.listIssuedInvoices(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch invoice details when a specific invoice is selected
  const { data: invoiceDetails, isLoading: isLoadingDetails } =
    useQuery<InvoiceResponse>({
      queryKey: ['invoice-issued-details', selectedInvoiceId],
      queryFn: () =>
        selectedInvoiceId
          ? InvoicesService.getIssuedInvoice(selectedInvoiceId)
          : Promise.reject(new Error('No invoice selected')),
      enabled: !!selectedInvoiceId && isDetailsOpen,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    });

  const invoices = useMemo(
    () => invoicesResponse?.invoices ?? [],
    [invoicesResponse?.invoices]
  );

  const filteredInvoices = useMemo(() => {
    let results = invoices;

    if (filterStatus !== 'ALL') {
      results = results.filter((inv) => inv.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      results = results.filter((inv) => {
        const searchFields = [
          inv.invoiceNumber,
          inv.recipient.displayName || inv.recipient.email || '',
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
      if (inv.status === 'PAID' || inv.status === 'ARCHIVED') {
        paid += inv.totalAmount;
      }
      if (
        inv.status === 'ISSUED' ||
        inv.status === 'VIEWED' ||
        inv.status === 'PARTIAL' ||
        inv.status === 'OVERDUE'
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
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t.issuedInvoices}
          </h1>
          <p className="text-muted-foreground">{t.issuedInvoicesDescription}</p>
        </div>
        <Button size="lg" className="gap-2" asChild>
          <Link href={`/${lang}/business/${businessId}/invoices/create`}>
            <FileText className="h-5 w-5" />
            {t.createInvoiceButton}
          </Link>
        </Button>
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
            <CardTitle>{t.issuedInvoicesList || 'Invoice List'}</CardTitle>
            <CardDescription>
              {isLoading
                ? '...'
                : `${filteredInvoices.length} ${filteredInvoices.length === 1 ? t.invoiceSingular || 'invoice' : t.invoicePlural || 'invoices'}`}
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
            {(['DRAFT', 'ISSUED', 'PAID', 'OVERDUE'] as const).map((status) => {
              const statusLabel =
                status === 'DRAFT'
                  ? 'Draft'
                  : status === 'ISSUED'
                    ? t.filterIssued
                    : status === 'PAID'
                      ? t.filterPaid
                      : t.filterOverdue;

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
            })}
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
                      {t.noIssuedInvoicesHint}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.invoiceNumber}</TableHead>
                  <TableHead>{t.recipient}</TableHead>
                  <TableHead>{t.amount}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.issuedDate}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.recipient.displayName ||
                        invoice.recipient.email ||
                        t.externalRecipient ||
                        'External Recipient'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.totalAmount.toLocaleString(lang, {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {invoice.currency}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[invoice.status]}>
                        <span className="mr-1">
                          {STATUS_ICONS[invoice.status]}
                        </span>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invoice.issuedDate).toLocaleDateString(lang)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInvoiceId(invoice.id);
                          setIsDetailsOpen(true);
                        }}
                      >
                        {t.view}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isLoadingDetails ? t.creatingLabel : t.invoiceDetailsTitle}
            </DialogTitle>
            <DialogDescription>
              {invoiceDetails?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : invoiceDetails ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t.invoiceNumberLabel}
                  </p>
                  <p className="font-medium">{invoiceDetails.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t.statusLabel}
                  </p>
                  <Badge className={STATUS_COLORS[invoiceDetails.status]}>
                    <span className="mr-1">
                      {STATUS_ICONS[invoiceDetails.status]}
                    </span>
                    {invoiceDetails.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t.amountLabel}
                  </p>
                  <p className="font-medium">
                    {invoiceDetails.totalAmount.toLocaleString(lang, {
                      minimumFractionDigits: 2,
                    })}{' '}
                    {invoiceDetails.currency}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t.issuedDateLabel}
                  </p>
                  <p className="font-medium">
                    {new Date(invoiceDetails.issuedDate).toLocaleDateString(
                      lang
                    )}
                  </p>
                </div>
              </div>

              {/* Description */}
              {invoiceDetails.description && (
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t.descriptionLabel}
                  </p>
                  <p className="text-sm">{invoiceDetails.description}</p>
                </div>
              )}

              {/* Line Items */}
              {invoiceDetails.lineItems &&
                invoiceDetails.lineItems.length > 0 && (
                  <div>
                    <p className="mb-3 text-sm font-medium">
                      {t.lineItemsLabel}
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.itemLabel}</TableHead>
                          <TableHead className="text-right">
                            {t.quantityLabel}
                          </TableHead>
                          <TableHead className="text-right">
                            {t.priceLabel}
                          </TableHead>
                          <TableHead className="text-right">
                            {t.totalLabel}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceDetails.lineItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.unitPrice.toLocaleString(lang, {
                                minimumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              {(item.quantity * item.unitPrice).toLocaleString(
                                lang,
                                { minimumFractionDigits: 2 }
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
            </div>
          ) : (
            <p className="text-muted-foreground">{t.failedToLoadDetails}</p>
          )}

          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t.closeButtonLabel}
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
