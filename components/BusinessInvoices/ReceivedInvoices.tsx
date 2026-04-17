'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  AlertCircle,
  Briefcase,
  X,
  Eye,
  CheckCircle,
  Clock,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoicesService } from '@/lib/requests';
import { Chatbot } from '@/components/Business/Chatbot';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { formatDate } from '@/lib/date-utils';
import { getStatusLabel } from '@/lib/status-labels';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import type { InvoiceStatus, InvoiceResponse } from '@/types/services';

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
    queryKey: ['invoices-received-business', businessId],
    queryFn: () =>
      InvoicesService.getReceivedInvoicesByBusiness({
        businessId: businessId,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch invoice details when a specific invoice is selected
  const { data: invoiceDetails, isLoading: isLoadingDetails } =
    useQuery<InvoiceResponse>({
      queryKey: ['invoice-received-details', selectedInvoiceId, businessId],
      queryFn: () =>
        selectedInvoiceId
          ? InvoicesService.getReceivedInvoiceDetails(
              selectedInvoiceId,
              businessId
            )
          : Promise.reject(new Error('No invoice selected')),
      enabled: !!selectedInvoiceId && isDetailsOpen,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    });

  // Export Invoice to PDF
  const exportToPDF = () => {
    if (!invoiceDetails) return;

    const doc = new jsPDF();

    // Brand Header
    doc.setFontSize(22);
    doc.setTextColor(138, 34, 34); // Primary color
    doc.text('Accountia', 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(50);
    doc.text(
      `${t.invoiceDetailsTitle} #${invoiceDetails.invoiceNumber}`,
      14,
      30
    );

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${t.statusLabel}: ${invoiceDetails.status}`, 14, 38);
    doc.text(
      `${t.issuedDateLabel}: ${formatDate(invoiceDetails.issuedDate, lang)}`,
      14,
      44
    );

    // Line items
    if (invoiceDetails.lineItems && invoiceDetails.lineItems.length > 0) {
      const tableColumn = [
        t.itemLabel,
        t.quantityLabel,
        t.priceLabel,
        t.totalLabel,
      ];
      const tableRows: Array<string | number>[] = [];

      for (const item of invoiceDetails.lineItems) {
        tableRows.push([
          item.description || item.productName || t.unknown,
          item.quantity,
          `${(item.unitPrice || 0).toLocaleString(lang, { minimumFractionDigits: 2 })} ${invoiceDetails.currency}`,
          `${item.amount.toLocaleString(lang, { minimumFractionDigits: 2 })} ${invoiceDetails.currency}`,
        ]);
      }

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        styles: { fontSize: 10, cellPadding: 4, font: 'helvetica' },
        headStyles: {
          fillColor: [138, 34, 34],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
      });
    }

    doc.setFontSize(12);
    doc.setTextColor(0);
    // @ts-expect-error - required by library
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 55;
    doc.text(
      `${t.amountLabel}: ${invoiceDetails.totalAmount.toLocaleString(lang, { minimumFractionDigits: 2 })} ${invoiceDetails.currency}`,
      14,
      finalY + 15
    );

    doc.save(`Receipt_${invoiceDetails.invoiceNumber}.pdf`);
  };

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
    const paid: Record<string, number> = {};
    const pending: Record<string, number> = {};

    for (const inv of invoices) {
      const currency = inv.currency || 'USD';

      if (inv.invoiceStatus === 'PAID' || inv.invoiceStatus === 'ARCHIVED') {
        paid[currency] = (paid[currency] || 0) + inv.totalAmount;
      }
      if (
        inv.invoiceStatus === 'ISSUED' ||
        inv.invoiceStatus === 'VIEWED' ||
        inv.invoiceStatus === 'PARTIAL' ||
        inv.invoiceStatus === 'OVERDUE'
      ) {
        pending[currency] = (pending[currency] || 0) + inv.totalAmount;
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
            <CardTitle className="text-2xl">
              {isLoading ? (
                '—'
              ) : (
                <div className="space-y-1">
                  {Object.entries(stats.paid).length === 0 ? (
                    <span>0</span>
                  ) : (
                    Object.entries(stats.paid).map(([currency, amount]) => (
                      <div key={currency} className="text-sm">
                        {amount.toLocaleString(lang, {
                          minimumFractionDigits: 2,
                        })}{' '}
                        {currency}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>

        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t.totalPending}</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? (
                '—'
              ) : (
                <div className="space-y-1">
                  {Object.entries(stats.pending).length === 0 ? (
                    <span>0</span>
                  ) : (
                    Object.entries(stats.pending).map(([currency, amount]) => (
                      <div key={currency} className="text-sm">
                        {amount.toLocaleString(lang, {
                          minimumFractionDigits: 2,
                        })}{' '}
                        {currency}
                      </div>
                    ))
                  )}
                </div>
              )}
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
                : `${filteredInvoices.length} ${filteredInvoices.length === 1 ? t.invoiceSingular : t.invoicePlural}`}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.invoiceNumber}</TableHead>
                    <TableHead>{t.from}</TableHead>
                    <TableHead>{t.amount}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.issuedDate}</TableHead>
                    <TableHead>{t.viewed}</TableHead>
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
                          {getStatusLabel(invoice.invoiceStatus, dictionary)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.issuedDate, lang)}
                      </TableCell>
                      <TableCell>
                        {invoice.recipientViewed ? (
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground text-sm">
                              {invoice.recipientViewedAt
                                ? formatDate(invoice.recipientViewedAt, lang)
                                : t.yesLabel}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto border-0 p-0 shadow-2xl sm:rounded-2xl dark:bg-slate-950">
          <div className="bg-primary/5 border-primary/10 border-b px-6 py-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {isLoadingDetails ? t.creatingLabel : t.invoiceDetailsTitle}
              </DialogTitle>
              <DialogDescription className="text-primary/80 mt-1 font-mono text-sm">
                {invoiceDetails?.invoiceNumber || (
                  <Skeleton className="h-4 w-32" />
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-4">
            {isLoadingDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pt-6">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            ) : invoiceDetails ? (
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="bg-muted/30 grid grid-cols-2 gap-6 rounded-xl p-6 sm:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {t.invoiceNumberLabel}
                    </p>
                    <p className="font-mono font-medium">
                      {invoiceDetails.invoiceNumber}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {t.statusLabel}
                    </p>
                    <Badge
                      className={`${STATUS_COLORS[invoiceDetails.status]} shadow-xs`}
                    >
                      <span className="mr-1">
                        {STATUS_ICONS[invoiceDetails.status]}
                      </span>
                      {invoiceDetails.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {t.amountLabel}
                    </p>
                    <p className="text-primary text-lg font-bold">
                      {invoiceDetails.totalAmount.toLocaleString(lang, {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {invoiceDetails.currency}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {t.columnIssuedDate}
                    </p>
                    <p className="font-medium">
                      {formatDate(invoiceDetails.issuedDate, lang)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {invoiceDetails.description && (
                  <div className="border-border/50 bg-card rounded-xl border p-5 shadow-xs">
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                      {t.descriptionLabel}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {invoiceDetails.description}
                    </p>
                  </div>
                )}

                {/* Line Items */}
                {invoiceDetails.lineItems &&
                  invoiceDetails.lineItems.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold tracking-tight">
                        {t.lineItemsLabel}
                      </h4>
                      <div className="border-border/50 overflow-hidden rounded-xl border shadow-xs">
                        <Table>
                          <TableHeader className="bg-muted/50">
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
                              <TableRow key={idx} className="hover:bg-muted/30">
                                <TableCell className="font-medium">
                                  {item.productName ||
                                    item.description ||
                                    t.unknown}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  {(item.unitPrice || 0).toLocaleString(lang, {
                                    minimumFractionDigits: 2,
                                  })}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {item.amount.toLocaleString(lang, {
                                    minimumFractionDigits: 2,
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex justify-end pt-4">
                        <div className="bg-primary/5 border-primary/10 flex items-center justify-between gap-12 rounded-xl border px-6 py-4">
                          <span className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                            {t.amountLabel}
                          </span>
                          <span className="text-primary text-2xl font-bold">
                            {invoiceDetails.totalAmount.toLocaleString(lang, {
                              minimumFractionDigits: 2,
                            })}{' '}
                            <span className="text-lg opacity-75">
                              {invoiceDetails.currency}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <p className="text-muted-foreground">{t.fetchError}</p>
            )}
          </div>

          <div className="bg-muted/20 border-t px-6 py-4">
            <DialogFooter className="w-full sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={exportToPDF}
                className="hover:bg-muted gap-2 bg-white dark:bg-transparent"
                disabled={isLoadingDetails || !invoiceDetails}
              >
                <Download className="h-4 w-4" />
                {t.exportPDF}
              </Button>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="default"
                  className="shadow-md transition-shadow hover:shadow-lg"
                >
                  {t.closeButtonLabel}
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chat Assistant - Business Mode */}
      <Chatbot businessId={businessId} dictionary={dictionary} />
    </div>
  );
}
