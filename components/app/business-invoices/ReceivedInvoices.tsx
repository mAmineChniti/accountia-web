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
  CreditCard,
  Loader2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoicesService } from '@/lib/requests';
import { Chatbot } from '@/components/app/business/Chatbot';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  InvoiceStatus,
  InvoiceResponse,
  InvoiceReceiptResponseDto,
} from '@/types/services';
import { cn } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { localizeErrorMessage } from '@/lib/error-localization';
import { env } from '@/env';

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

const PAYABLE_INVOICE_STATUSES = new Set<InvoiceStatus>([
  'ISSUED',
  'VIEWED',
  'PARTIAL',
  'OVERDUE',
  'DISPUTED',
]);

const stripePublishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : undefined;
const mockInvoicePaymentsEnabled =
  String(env.NEXT_PUBLIC_MOCK_INVOICE_PAYMENTS ?? '').toLowerCase() === 'true';

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
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<
    string | undefined
  >();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Payment state
  const [paymentClientSecret, setPaymentClientSecret] = useState<
    string | undefined
  >();
  const [paymentInvoiceLabel, setPaymentInvoiceLabel] = useState<string>('');
  const [mockPaymentInvoice, setMockPaymentInvoice] = useState<
    InvoiceReceiptResponseDto | undefined
  >();
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [activeReceiptId, setActiveReceiptId] = useState<string | undefined>();
  const [showMockConfirm, setShowMockConfirm] = useState(false);
  const [mockPaymentForm, setMockPaymentForm] = useState({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    country: 'Tunisia',
  });
  const [mockPaymentErrors, setMockPaymentErrors] = useState({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    country: '',
  });

  const {
    data: invoicesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['invoices-received-business', businessId],
    queryFn: () =>
      InvoicesService.getReceivedInvoicesByBusiness({
        businessId: businessId,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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

  // Stripe checkout mutation
  const { mutate: startCheckout, isPending: isStartingCheckout } = useMutation({
    mutationFn: async (invoice: InvoiceReceiptResponseDto) => {
      setActiveReceiptId(invoice.id);
      return InvoicesService.createIndividualCheckoutSession(invoice.id);
    },
    onSuccess: async (data) => {
      setActiveSessionId(data.sessionId);
      setPaymentInvoiceLabel('');
      setPaymentClientSecret(data.clientSecret ?? '');
      await queryClient.invalidateQueries({
        queryKey: ['invoices-received-business'],
      });
    },
    onError: (error: unknown) => {
      toast.error(localizeErrorMessage(error, dictionary, t.fetchError));
    },
  });

  // Mock payment mutation
  const { mutate: submitMockPayment, isPending: isSubmittingMockPayment } =
    useMutation({
      mutationFn: () => {
        if (!mockPaymentInvoice) throw new Error('No invoice selected');
        return InvoicesService.createIndividualMockPayment(
          mockPaymentInvoice.id,
          {
            cardholderName: mockPaymentForm.cardholderName,
            cardNumber: mockPaymentForm.cardNumber,
            expiry: mockPaymentForm.expiry,
            cvc: mockPaymentForm.cvc,
          }
        );
      },
      onSuccess: () => {
        setMockPaymentInvoice(undefined);
        setMockPaymentForm({
          cardholderName: '',
          cardNumber: '',
          expiry: '',
          cvc: '',
          country: 'Tunisia',
        });
        setMockPaymentErrors({
          cardholderName: '',
          cardNumber: '',
          expiry: '',
          cvc: '',
          country: '',
        });
        void refetch();
      },
      onError: (error: unknown) => {
        toast.error(localizeErrorMessage(error, dictionary, t.fetchError));
      },
    });

  const validateMockPaymentForm = (): boolean => {
    const errors = {
      cardholderName: '',
      cardNumber: '',
      expiry: '',
      cvc: '',
      country: '',
    };
    const v = t.payment.validation;
    if (!mockPaymentForm.cardholderName.trim())
      errors.cardholderName = v.nameRequired;
    if (!/^\d{4}(?:\s\d{4}){3}$/.test(mockPaymentForm.cardNumber))
      errors.cardNumber = v.numberInvalid;
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(mockPaymentForm.expiry))
      errors.expiry = v.expiryInvalid;
    if (!/^\d{3,4}$/.test(mockPaymentForm.cvc)) errors.cvc = v.cvcInvalid;
    if (!mockPaymentForm.country.trim()) errors.country = v.countryRequired;
    setMockPaymentErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const canPayInvoice = (invoice: InvoiceReceiptResponseDto): boolean =>
    PAYABLE_INVOICE_STATUSES.has(invoice.invoiceStatus);

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
    doc.text(
      `${t.statusLabel}: ${getStatusLabel(invoiceDetails.status, dictionary)}`,
      14,
      38
    );
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
                {invoiceDetails?.invoiceNumber || '...'}
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
                      className={cn(
                        STATUS_COLORS[invoiceDetails.status],
                        'shadow-xs'
                      )}
                    >
                      <span className="mr-1">
                        {STATUS_ICONS[invoiceDetails.status]}
                      </span>
                      {getStatusLabel(invoiceDetails.status, dictionary)}
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
              <div className="flex gap-2">
                {invoiceDetails &&
                  canPayInvoice({
                    invoiceStatus: invoiceDetails.status,
                  } as InvoiceReceiptResponseDto) && (
                    <Button
                      type="button"
                      variant="default"
                      disabled={isStartingCheckout}
                      onClick={() => {
                        if (!invoiceDetails) return;
                        // Build a minimal InvoiceReceiptResponseDto from details
                        const receiptInvoice = {
                          id: selectedInvoiceId ?? '',
                          invoiceStatus: invoiceDetails.status,
                        } as InvoiceReceiptResponseDto;
                        if (mockInvoicePaymentsEnabled) {
                          setIsDetailsOpen(false);
                          setMockPaymentInvoice(receiptInvoice);
                          return;
                        }
                        setIsDetailsOpen(false);
                        startCheckout(receiptInvoice);
                      }}
                    >
                      {isStartingCheckout ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.payment.processing}
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          {mockInvoicePaymentsEnabled
                            ? t.payNowDemo
                            : t.payment.payNow}
                        </>
                      )}
                    </Button>
                  )}
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="shadow-md transition-shadow hover:shadow-lg"
                  >
                    {t.closeButtonLabel}
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mock Payment Dialog */}
      <Dialog
        open={Boolean(mockPaymentInvoice)}
        onOpenChange={(open) => {
          if (!open) {
            setMockPaymentInvoice(undefined);
            setMockPaymentErrors({
              cardholderName: '',
              cardNumber: '',
              expiry: '',
              cvc: '',
              country: '',
            });
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.payment.securePayment}</DialogTitle>
            <DialogDescription>{t.payment.completeCardInfo}</DialogDescription>
          </DialogHeader>

          <div className="dark:bg-card space-y-6 rounded-xl border bg-white p-6 shadow-sm">
            {/* Demo Cards */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                {t.payment.demoCardLabel}
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  {
                    name: t.payment.demoCardSuccess,
                    number: '4242 4242 4242 4242',
                    expiry: '12/29',
                    cvc: '123',
                  },
                  {
                    name: t.payment.demoCardDeclined,
                    number: '4000 4000 4000 0002',
                    expiry: '12/29',
                    cvc: '123',
                  },
                  {
                    name: t.payment.demoCardExpired,
                    number: '4000 4000 4000 0003',
                    expiry: '01/20',
                    cvc: '123',
                  },
                ].map((card) => (
                  <Button
                    key={card.number}
                    type="button"
                    variant="outline"
                    className="hover:border-primary hover:bg-primary/5 flex h-auto flex-col items-start px-4 py-3 transition-all"
                    onClick={() =>
                      setMockPaymentForm((prev) => ({
                        ...prev,
                        cardNumber: card.number,
                        expiry: card.expiry,
                        cvc: card.cvc,
                      }))
                    }
                  >
                    <span className="text-sm font-bold">{card.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {card.number}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Separator />
              <div className="relative flex justify-center text-xs uppercase">
                <span className="text-muted-foreground dark:bg-card bg-white px-2 font-medium">
                  {t.payment.cardInfo}
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="biz-cardholderName"
                  className="text-sm font-semibold"
                >
                  {t.payment.cardholderName}
                </Label>
                <Input
                  id="biz-cardholderName"
                  value={mockPaymentForm.cardholderName}
                  onChange={(e) =>
                    setMockPaymentForm((prev) => ({
                      ...prev,
                      cardholderName: e.target.value,
                    }))
                  }
                  placeholder={t.payment.cardholderPlaceholder}
                  className={cn(
                    mockPaymentErrors.cardholderName && 'border-red-500'
                  )}
                />
                {mockPaymentErrors.cardholderName && (
                  <p className="text-xs text-red-600">
                    {mockPaymentErrors.cardholderName}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-semibold">
                  {t.payment.cardInfo}
                </Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <Input
                      value={mockPaymentForm.cardNumber}
                      readOnly
                      placeholder="4242 4242 4242 4242"
                      className={cn(
                        mockPaymentErrors.cardNumber && 'border-red-500'
                      )}
                    />
                  </div>
                  <div>
                    <Input
                      value={mockPaymentForm.expiry}
                      readOnly
                      placeholder="12/29"
                      className={cn(
                        mockPaymentErrors.expiry && 'border-red-500'
                      )}
                    />
                  </div>
                  <div>
                    <Input
                      value={mockPaymentForm.cvc}
                      readOnly
                      placeholder="123"
                      className={cn(mockPaymentErrors.cvc && 'border-red-500')}
                    />
                  </div>
                </div>
                {(mockPaymentErrors.cardNumber ||
                  mockPaymentErrors.expiry ||
                  mockPaymentErrors.cvc) && (
                  <p className="text-xs text-red-600">
                    {mockPaymentErrors.cardNumber ||
                      mockPaymentErrors.expiry ||
                      mockPaymentErrors.cvc}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-semibold">
                  {t.payment.country}
                </Label>
                <Select
                  value={mockPaymentForm.country}
                  onValueChange={(value) =>
                    setMockPaymentForm((prev) => ({ ...prev, country: value }))
                  }
                >
                  <SelectTrigger
                    className={cn(
                      mockPaymentErrors.country && 'border-red-500'
                    )}
                  >
                    <SelectValue
                      placeholder={t.payment.selectCountryPlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>
                        {t.payment.countryGroups.northAfrica}
                      </SelectLabel>
                      <SelectItem value="Tunisia">Tunisia</SelectItem>
                      <SelectItem value="Algeria">Algeria</SelectItem>
                      <SelectItem value="Morocco">Morocco</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>
                        {t.payment.countryGroups.europe}
                      </SelectLabel>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="United Kingdom">
                        United Kingdom
                      </SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>
                        {t.payment.countryGroups.northAmerica}
                      </SelectLabel>
                      <SelectItem value="United States">
                        United States
                      </SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{t.payment.countryGroups.other}</SelectLabel>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Brazil">Brazil</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {mockPaymentErrors.country && (
                  <p className="text-xs text-red-600">
                    {mockPaymentErrors.country}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setMockPaymentInvoice(undefined)}
              >
                {t.payment.cancel}
              </Button>
              <Button
                className="flex-1"
                disabled={isSubmittingMockPayment}
                onClick={() => {
                  if (!validateMockPaymentForm()) {
                    toast.error(t.payment.requiredFieldsError);
                    return;
                  }
                  setShowMockConfirm(true);
                }}
              >
                {isSubmittingMockPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.payment.processing}
                  </>
                ) : (
                  t.payment.payNow
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded Stripe Checkout Dialog */}
      <Dialog
        open={Boolean(paymentClientSecret)}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentClientSecret(undefined);
            setPaymentInvoiceLabel('');
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.payment.completeYourPayment}</DialogTitle>
            <DialogDescription>
              {paymentInvoiceLabel || t.payment.secureCardPayment}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-background min-h-[720px] rounded-lg border p-3">
            {paymentClientSecret && stripePromise ? (
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                  clientSecret: paymentClientSecret,
                  onComplete: () => {
                    void (async () => {
                      const sessionId = activeSessionId;
                      const receiptId = activeReceiptId;
                      setPaymentClientSecret(undefined);
                      setPaymentInvoiceLabel('');
                      setActiveSessionId(undefined);
                      setActiveReceiptId(undefined);
                      if (sessionId && receiptId) {
                        try {
                          await InvoicesService.confirmPayment({
                            sessionId,
                            receiptId,
                          });
                        } catch (error) {
                          console.error(
                            'Manual payment confirmation failed:',
                            error
                          );
                        }
                      }
                      void queryClient
                        .invalidateQueries({
                          queryKey: ['invoices-received-business'],
                        })
                        .then(() => {
                          toast.success(t.payment.successful);
                        });
                    })();
                  },
                }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            ) : (
              <div className="text-muted-foreground flex min-h-[400px] items-center justify-center text-sm">
                {t.payment.loadingForm}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mock Confirm Dialog */}
      <Dialog
        open={showMockConfirm}
        onOpenChange={(open) => {
          if (!open) setShowMockConfirm(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-4 flex justify-center">
              <CreditCard className="text-primary h-16 w-16" />
            </div>
            <DialogTitle className="text-center text-xl">
              {t.payment.confirmTitle}
            </DialogTitle>
            <div className="text-muted-foreground space-y-1 text-center text-sm">
              <p>{t.payment.confirmQuestion}</p>
              <p className="text-primary text-lg font-bold">
                {mockPaymentInvoice?.totalAmount?.toLocaleString(lang, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                {mockPaymentInvoice?.currency}
              </p>
              <p className="text-sm">{mockPaymentInvoice?.invoiceNumber}</p>
            </div>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMockConfirm(false)}
            >
              {t.payment.cancel}
            </Button>
            <Button
              type="button"
              disabled={isSubmittingMockPayment}
              onClick={() => {
                setShowMockConfirm(false);
                submitMockPayment();
              }}
            >
              {isSubmittingMockPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.payment.processing}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t.payment.confirmAction}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Chat Assistant - Business Mode */}
      <Chatbot
        businessId={businessId}
        context="received"
        dictionary={dictionary}
        key={`${businessId}-received`}
      />
    </div>
  );
}
