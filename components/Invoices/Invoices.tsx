'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
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
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { formatDate } from '@/lib/date-utils';
import { type StaticInvoice, type InvoiceStatus } from '@/lib/data/invoices';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RawTransaction {
  id: string;
  accountType?: string;
  amount?: number;
  type?: 'income' | 'expense';
  date?: string;
}

async function downloadInvoicePdf(id: string): Promise<void> {
  try {
    const response = await AdminStatsRequests.downloadInvoice(id);
    const blob = await response.blob();
    const blobUrl = globalThis.URL.createObjectURL(
      new Blob([blob], { type: 'application/pdf' })
    );
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `invoice-${id.slice(-6).toUpperCase()}.pdf`;
    document.body.append(a);
    a.click();
    globalThis.URL.revokeObjectURL(blobUrl);
    a.remove();
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download invoice');
  }
}

import { useQuery } from '@tanstack/react-query';
import { AdminStatsRequests } from '@/lib/requests';
import {
  Loader2,
  DollarSign,
  Euro,
  Coins,
  Globe,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ReactNode;
    color: string;
  }
> = {
  PAID: {
    label: 'Paid',
    variant: 'default',
    icon: <CheckCircle className="h-3 w-3" />,
    color: 'text-green-600',
  },
  PENDING: {
    label: 'Pending',
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
    color: 'text-orange-500',
  },
  OVERDUE: {
    label: 'Overdue',
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
    color: 'text-red-600',
  },
  DRAFT: {
    label: 'Draft',
    variant: 'outline',
    icon: <FileText className="h-3 w-3" />,
    color: 'text-muted-foreground',
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'outline',
    icon: <XCircle className="h-3 w-3" />,
    color: 'text-muted-foreground',
  },
};

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  TND: 'DT',
};

export default function Invoices({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const t = dictionary.pages.invoices;

  const [selectedCurrency, setSelectedCurrency] = useState<
    'USD' | 'EUR' | 'TND'
  >('USD');

  // Fetch exchange rates
  const { data: exchangeRates } = useQuery({
    queryKey: ['exchange-rates', selectedCurrency],
    queryFn: async () => {
      if (selectedCurrency === 'USD') return 1;
      // Hardcoded fallbacks for currencies not supported by Frankfurter (ECB)
      if (selectedCurrency === 'TND') return 3.12;

      try {
        const response = await fetch(
          `https://api.frankfurter.app/latest?from=USD&to=${selectedCurrency}`
        );
        if (!response.ok) {
          // If API fails, return a fallback if we have one
          const fallbacks: Record<string, number> = { EUR: 0.92, TND: 3.12 };
          return fallbacks[selectedCurrency] || 1;
        }
        const data = await response.json();
        return data.rates[selectedCurrency] || 1;
      } catch (error_) {
        console.error('Failed to fetch exchange rate', error_);
        const fallbacks: Record<string, number> = { EUR: 0.92, TND: 3.12 };
        return fallbacks[selectedCurrency] || 1;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const rate = exchangeRates || 1;

  const {
    data: realInvoices = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invoices-real', 50],
    queryFn: async () => {
      const transactions = await AdminStatsRequests.getFilteredTransactions({
        limit: 50,
      });
      return transactions.map(
        (t: any): StaticInvoice & { originalAmount: number } => ({
          id: t.id,
          invoiceNumber: `INV-${t.id.toString().slice(-6).toUpperCase()}`,
          description: t.accountType || 'Transaction',
          amount: Number(t.amount) || 0,
          originalAmount: Number(t.amount) || 0,
          currency: 'USD', // Base currency is USD
          status: t.type === 'income' ? 'PAID' : 'PENDING',
          dueDate: t.date,
          createdAt: t.date,
          paidAt: t.type === 'income' ? t.date : undefined,
        })
      );
    },
  });

  const convertedInvoices = realInvoices.map((invoice) => ({
    ...invoice,
    amount: invoice.originalAmount * rate,
    currency: selectedCurrency,
  }));

  const handleDownload = async (id: string) => {
    try {
      const response = await AdminStatsRequests.downloadInvoice(id);
      const blob = await response.blob();
      const blobUrl = globalThis.URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      );
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `invoice-${id.slice(-6).toUpperCase()}.pdf`;
      document.body.append(a);
      a.click();
      globalThis.URL.revokeObjectURL(blobUrl);
      a.remove();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const invoices = convertedInvoices;

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter((invoice) => {
    if (statusFilter === 'all') return true;

    const isOverdue =
      invoice.status === 'PENDING' && new Date(invoice.dueDate) < new Date();

    if (statusFilter === 'paid') return invoice.status === 'PAID';
    if (statusFilter === 'overdue')
      return isOverdue || invoice.status === 'OVERDUE';
    if (statusFilter === 'pending')
      return invoice.status === 'PENDING' && !isOverdue;

    return true;
  });

  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPending = invoices
    .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + i.amount, 0);

  const currency = invoices[0]?.currency ?? 'USD';

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.description}</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardDescription>{t.totalInvoices}</CardDescription>
              <CardTitle className="text-2xl">{invoices.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardDescription>{t.totalPaid}</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {currencySymbols[selectedCurrency]} {totalPaid.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardDescription>{t.totalPending}</CardDescription>
              <CardTitle className="text-2xl text-orange-500">
                {currencySymbols[selectedCurrency]} {totalPending.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.invoiceList}
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <Globe className="text-muted-foreground h-4 w-4" />
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value as any)}
                  className="text-foreground cursor-pointer border-none bg-transparent text-xs outline-none focus:ring-0 [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="TND">TND (DT)</option>
                </select>
              </div>

              <div className="mr-2 hidden items-center gap-2 sm:flex">
                <Filter className="text-muted-foreground h-4 w-4" />
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList className="h-9">
                    <TabsTrigger value="all" className="text-xs">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="paid" className="text-xs">
                      Paid
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs">
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="overdue" className="text-xs">
                      Overdue
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Link href={`/${lang}/business-application`}>
                <Button size="sm" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  {t.createBusinessButton}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Filter view */}
            <div className="mb-4 flex items-center justify-between border-b pb-4 sm:hidden">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" /> Filter
              </span>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="paid" className="text-xs">
                    Paid
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="overdue" className="text-xs">
                    Overdue
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {isLoading ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 h-8 w-8 animate-spin opacity-50" />
                <p className="text-sm">Loading real transactions...</p>
              </div>
            ) : error ? (
              <div className="text-destructive py-12 text-center text-sm">
                <p>Failed to load invoices from MongoDB.</p>
                <p className="text-xs opacity-70">
                  Please check your connection and try again.
                </p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 opacity-30" />
                <p className="text-sm">{t.noInvoices}</p>
                <p className="mt-1 text-xs opacity-70">{t.noInvoicesHint}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => {
                  const cfg = statusConfig[invoice.status];
                  const isOverdue =
                    invoice.status === 'PENDING' &&
                    new Date(invoice.dueDate) < new Date();

                  return (
                    <div
                      key={invoice.id}
                      className="hover:bg-muted/30 flex flex-col gap-2 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {invoice.invoiceNumber}
                          </span>
                          <Badge
                            variant={isOverdue ? 'destructive' : cfg.variant}
                            className="flex items-center gap-1 text-xs"
                          >
                            {cfg.icon}
                            {isOverdue ? t.statusOverdue : cfg.label}
                          </Badge>
                        </div>
                        <span className="text-sm">{invoice.description}</span>
                        <div className="text-muted-foreground flex gap-3 text-xs">
                          <span>
                            {t.dueDateLabel}:{' '}
                            {formatDate(invoice.dueDate, lang)}
                          </span>
                          {invoice.paidAt && (
                            <span className="text-green-600">
                              {t.paidAtLabel}:{' '}
                              {formatDate(invoice.paidAt, lang)}
                            </span>
                          )}
                        </div>
                        {invoice.notes && (
                          <span className="text-muted-foreground text-xs italic">
                            {invoice.notes}
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`text-lg font-bold ${cfg.color}`}>
                          {currencySymbols[selectedCurrency]}{' '}
                          {invoice.amount.toFixed(2)}
                        </span>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(invoice.createdAt, lang)}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-primary/10 mt-2 h-8 gap-1.5 text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDownload(invoice.id);
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
