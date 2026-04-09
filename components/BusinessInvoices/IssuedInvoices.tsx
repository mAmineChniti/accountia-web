'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
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
import { BusinessService, InvoicesService } from '@/lib/requests';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type {
  InvoiceStatus,
  InvoiceResponse,
  ClientPodiumItem,
} from '@/types/services';

type FilterStatus = 'ALL' | InvoiceStatus | 'PODIUM';

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

const ALLOWED_STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ['ISSUED', 'VOIDED'],
  ISSUED: ['VIEWED', 'PAID', 'OVERDUE', 'DISPUTED', 'VOIDED'],
  VIEWED: ['PAID', 'PARTIAL', 'OVERDUE', 'DISPUTED', 'VOIDED'],
  PAID: ['ARCHIVED'],
  PARTIAL: ['PAID', 'OVERDUE', 'DISPUTED', 'VOIDED'],
  OVERDUE: ['PAID', 'PARTIAL', 'DISPUTED', 'VOIDED'],
  DISPUTED: ['PAID', 'VOIDED'],
  VOIDED: ['ARCHIVED'],
  ARCHIVED: [],
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
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<
    string | undefined
  >();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesByNumber, setPagesByNumber] = useState<
    Record<number, InvoiceResponse[]>
  >({});
  const previousBusinessIdRef = useRef<string>(businessId);

  const {
    data: invoicesResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['invoices-issued', businessId, currentPage],
    queryFn: () =>
      InvoicesService.listIssuedInvoices({
        businessId,
        page: currentPage,
        limit: 10,
      }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: clientPodiumResponse, isLoading: isLoadingPodium } = useQuery({
    queryKey: ['business-client-podium', businessId],
    queryFn: () => BusinessService.getClientPodium(businessId),
    enabled: filterStatus === 'PODIUM',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Store invoices by page so refetches replace the corresponding page slice.

  useEffect(() => {
    let isMounted = true;

    if (!invoicesResponse?.invoices || !invoicesResponse.page) {
      return () => {
        isMounted = false;
      };
    }

    queueMicrotask(() => {
      if (!isMounted) return;
      setPagesByNumber((previousPages) => ({
        ...previousPages,
        [invoicesResponse.page]: invoicesResponse.invoices,
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [invoicesResponse]);

  // Fetch invoice details when a specific invoice is selected
  const {
    data: invoiceDetails,
    isLoading: isLoadingDetails,
    error: invoiceError,
  } = useQuery<InvoiceResponse>({
    queryKey: ['invoice-issued-details', selectedInvoiceId, businessId],
    queryFn: () => {
      if (!selectedInvoiceId) {
        return Promise.reject(new Error('No invoice selected'));
      }
      return InvoicesService.getIssuedInvoice(selectedInvoiceId, businessId);
    },
    enabled: !!selectedInvoiceId && isDetailsOpen,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1, // Retry once on failure
  });

  // Reset pagination only when businessId actually changes (not on first mount)
  useEffect(() => {
    let isMounted = true;

    if (previousBusinessIdRef.current === businessId) {
      return () => {
        isMounted = false;
      };
    }

    previousBusinessIdRef.current = businessId;
    queueMicrotask(() => {
      if (!isMounted) return;
      setCurrentPage(1);
      setPagesByNumber({});
    });

    return () => {
      isMounted = false;
    };
  }, [businessId]);

  // Mutation for transitioning invoice status
  const { mutate: transitionStatus, isPending: isTransitioning } = useMutation({
    mutationFn: (newStatus: InvoiceStatus) => {
      const payload: {
        newStatus: InvoiceStatus;
        businessId: string;
        amountPaid?: number;
      } = {
        newStatus,
        businessId,
      };

      if (
        newStatus === 'PAID' &&
        invoiceDetails &&
        Number.isFinite(invoiceDetails.totalAmount)
      ) {
        payload.amountPaid = invoiceDetails.totalAmount;
      }

      return InvoicesService.transitionInvoice(selectedInvoiceId!, payload);
    },
    onSuccess: (data) => {
      // Update invoice details in cache
      queryClient.setQueryData(
        ['invoice-issued-details', selectedInvoiceId, businessId],
        data
      );
      // Also invalidate the invoices list to refresh it
      queryClient.invalidateQueries({
        queryKey: ['invoices-issued', businessId],
      });
    },
  });

  const invoices = useMemo(
    () =>
      Object.keys(pagesByNumber)
        .map(Number)
        .toSorted((a, b) => a - b)
        .flatMap((page) => pagesByNumber[page] ?? []),
    [pagesByNumber]
  );
  const totalPages = invoicesResponse?.totalPages ?? 0;

  const filteredInvoices = useMemo(() => {
    let results = invoices;

    if (filterStatus !== 'ALL' && filterStatus !== 'PODIUM') {
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

  const podiumClients = useMemo(() => {
    const podium = clientPodiumResponse?.podium ?? [];
    if (!searchQuery.trim()) {
      return podium;
    }

    const query = searchQuery.trim().toLowerCase();
    return podium.filter((client) => {
      const searchFields = [
        client.clientName,
        client.clientEmail,
        client.totalPaidInvoices.toString(),
        client.totalPaidAmount.toString(),
      ].map((f) => f.toLowerCase());
      return searchFields.some((field) => field.includes(query));
    });
  }, [clientPodiumResponse?.podium, searchQuery]);

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
      `${t.invoiceDetailsTitle || 'Invoice'} #${invoiceDetails.invoiceNumber}`,
      14,
      30
    );

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${t.statusLabel || 'Status'}: ${invoiceDetails.status}`, 14, 38);
    doc.text(
      `${t.issuedDateLabel || 'Issued Date'}: ${new Date(invoiceDetails.issuedDate).toLocaleDateString(lang)}`,
      14,
      44
    );

    // Line items
    if (invoiceDetails.lineItems && invoiceDetails.lineItems.length > 0) {
      const tableColumn = [
        t.itemLabel || 'Item',
        t.quantityLabel || 'Qty',
        t.priceLabel || 'Price',
        t.totalLabel || 'Total',
      ];
      const tableRows: Array<string | number>[] = [];

      for (const item of invoiceDetails.lineItems) {
        tableRows.push([
          item.description || item.productName || 'Item',
          item.quantity,
          `${item.unitPrice.toLocaleString(lang, { minimumFractionDigits: 2 })} ${invoiceDetails.currency}`,
          `${(item.quantity * item.unitPrice).toLocaleString(lang, { minimumFractionDigits: 2 })} ${invoiceDetails.currency}`,
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
    // @ts-expect-error - jspdf-autotable adds lastAutoTable to doc
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 55;
    doc.text(
      `${t.amountLabel || 'Total Amount'}: ${invoiceDetails.totalAmount.toLocaleString(lang, { minimumFractionDigits: 2 })} ${invoiceDetails.currency}`,
      14,
      finalY + 15
    );

    doc.save(`Invoice_${invoiceDetails.invoiceNumber}.pdf`);
  };

  const stats = useMemo(() => {
    const paid: Record<string, number> = {};
    const pending: Record<string, number> = {};

    for (const inv of invoices) {
      const currency = inv.currency || 'USD';

      if (inv.status === 'PAID' || inv.status === 'ARCHIVED') {
        paid[currency] = (paid[currency] || 0) + inv.totalAmount;
      }
      if (
        inv.status === 'ISSUED' ||
        inv.status === 'VIEWED' ||
        inv.status === 'PARTIAL' ||
        inv.status === 'OVERDUE'
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

  if (isFetching && !invoicesResponse) {
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
              {isLoading ? '—' : (invoicesResponse?.total ?? stats.total)}
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
            <Button
              size="sm"
              variant={filterStatus === 'PODIUM' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('PODIUM')}
              disabled={isFetching}
              className={
                filterStatus === 'PODIUM'
                  ? 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700'
                  : ''
              }
            >
              {t.topPayingClientsFilter}
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
          {(
            filterStatus === 'PODIUM'
              ? !isLoadingPodium && podiumClients.length === 0
              : filteredInvoices.length === 0
          ) ? (
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
                      {filterStatus === 'PODIUM'
                        ? t.noTopPayingClients
                        : t.noInvoices}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {filterStatus === 'PODIUM'
                        ? t.noTopPayingClientsHint
                        : t.noIssuedInvoicesHint}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : filterStatus === 'PODIUM' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.rank}</TableHead>
                  <TableHead>{t.recipient}</TableHead>
                  <TableHead>{t.recipientEmailLabel}</TableHead>
                  <TableHead className="text-right">{t.totalPaid}</TableHead>
                  <TableHead className="text-right">
                    {t.totalInvoices}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(podiumClients as ClientPodiumItem[]).map((client, index) => {
                  const rankBadge = client.medal || `${index + 1}.`;

                  return (
                    <TableRow
                      key={client.clientId}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{rankBadge}</TableCell>
                      <TableCell className="font-medium">
                        {client.clientName || t.unknownClient}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.clientEmail || '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {client.totalPaidAmount.toLocaleString(lang, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {client.totalPaidInvoices}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
                {filteredInvoices.map((invoice, _index) => (
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

          {/* Load More Button */}
          {filterStatus !== 'PODIUM' && currentPage < totalPages && (
            <div className="flex justify-center border-t pt-4">
              <Button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={isFetching}
                variant="outline"
              >
                {isFetching ? t.loadingMoreInvoices : t.loadMoreInvoices}
              </Button>
            </div>
          )}

          {filterStatus === 'PODIUM' && isLoadingPodium && (
            <div className="text-muted-foreground flex justify-center border-t pt-4 text-sm">
              {t.loadingTopPayingClients}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isLoadingDetails ? t.creatingLabel : t.invoiceDetailsTitle}
            </DialogTitle>
            {invoiceDetails?.invoiceNumber && (
              <DialogDescription>
                {invoiceDetails.invoiceNumber}
              </DialogDescription>
            )}
          </DialogHeader>

          <div>
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
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
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
                    {(() => {
                      const availableStatuses = [
                        invoiceDetails.status,
                        ...ALLOWED_STATUS_TRANSITIONS[invoiceDetails.status],
                      ];

                      return (
                        <Select
                          value={invoiceDetails.status}
                          onValueChange={(newStatus) =>
                            transitionStatus(newStatus as InvoiceStatus)
                          }
                          disabled={isTransitioning}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                  <span>{STATUS_ICONS[status]}</span>
                                  {status}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })()}
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
                      {t.issuedDateLabel}
                    </p>
                    <p className="font-medium">
                      {new Date(invoiceDetails.issuedDate).toLocaleDateString(
                        lang,
                        { year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {invoiceDetails.description && (
                  <div>
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
                      <div>
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
                                    'Unknown'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.unitPrice.toLocaleString(lang, {
                                    minimumFractionDigits: 2,
                                  })}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {(
                                    item.quantity * item.unitPrice
                                  ).toLocaleString(lang, {
                                    minimumFractionDigits: 2,
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex justify-end pt-4">
                        <div className="flex items-center justify-between gap-12">
                          <span className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                            {t.amountLabel || 'Total'}
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
            ) : invoiceError ? (
              <div className="space-y-4">
                <p className="text-muted-foreground font-semibold">
                  {t.failedToLoadDetails}
                </p>
                <p className="text-muted-foreground text-sm">
                  {invoiceError instanceof Error
                    ? invoiceError.message
                    : 'Unknown error occurred'}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">{t.failedToLoadDetails}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={exportToPDF}
              disabled={isLoadingDetails || !invoiceDetails}
            >
              <Download className="h-4 w-4" />
              {(t as Record<string, string>).exportPDF || 'Export PDF'}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="default">
                {(t as Record<string, string>).closeButtonLabel || 'Close'}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
