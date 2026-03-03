'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
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
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { InvoiceService } from '@/lib/requests';
import type { InvoiceItem } from '@/types/ResponseInterfaces';

// ─── Status config ──────────────────────────────────────────────────────────

type InvoiceStatus = InvoiceItem['status'];

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ReactNode;
    color: string;
  }
> = {
  PAID:      { label: 'Paid',      variant: 'default',     icon: <CheckCircle className="h-3 w-3" />, color: 'text-green-600' },
  PENDING:   { label: 'Pending',   variant: 'secondary',   icon: <Clock className="h-3 w-3" />,       color: 'text-orange-500' },
  OVERDUE:   { label: 'Overdue',   variant: 'destructive', icon: <XCircle className="h-3 w-3" />,     color: 'text-red-600' },
  DRAFT:     { label: 'Draft',     variant: 'outline',     icon: <FileText className="h-3 w-3" />,    color: 'text-muted-foreground' },
  CANCELLED: { label: 'Cancelled', variant: 'outline',     icon: <XCircle className="h-3 w-3" />,     color: 'text-muted-foreground' },
};

// ─── Skeleton loader ────────────────────────────────────────────────────────

function InvoicesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────

export default function Invoices({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const t = (dictionary.pages as any).invoices as Record<string, string> | undefined;

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await InvoiceService.getMyInvoices();
      setInvoices(response.invoices);
    } catch {
      setError(t?.fetchError ?? 'Failed to load invoices. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Stats ──────────────────────────────────────────────────────────────

  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPending = invoices
    .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + i.amount, 0);

  const currency = invoices[0]?.currency ?? 'USD';

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t?.title ?? 'My Invoices'}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t?.description ?? 'View and manage your invoices'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInvoices}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t?.refresh ?? 'Refresh'}
          </Button>
          <Link href={`/${lang}/business-application`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Briefcase className="h-4 w-4" />
              {t?.applyBusinessButton ?? 'Apply for Business Access'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Cartes résumé */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t?.totalInvoices ?? 'Total Invoices'}</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? <Skeleton className="h-8 w-12" /> : invoices.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t?.totalPaid ?? 'Total Paid'}</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {isLoading
                ? <Skeleton className="h-8 w-24" />
                : `${currency} ${totalPaid.toFixed(2)}`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t?.totalPending ?? 'Total Pending'}</CardDescription>
            <CardTitle className="text-2xl text-orange-500">
              {isLoading
                ? <Skeleton className="h-8 w-24" />
                : `${currency} ${totalPending.toFixed(2)}`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Liste des factures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t?.invoiceList ?? 'Invoice List'}
          </CardTitle>
        </CardHeader>
        <CardContent>

          {/* Chargement */}
          {isLoading && <InvoicesSkeleton />}

          {/* Erreur */}
          {!isLoading && error && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="text-destructive h-10 w-10" />
              <p className="text-destructive text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchInvoices}>
                {t?.retry ?? 'Try again'}
              </Button>
            </div>
          )}

          {/* Vide */}
          {!isLoading && !error && invoices.length === 0 && (
            <div className="text-muted-foreground py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p className="text-sm">{t?.noInvoices ?? 'No invoices yet'}</p>
              <p className="mt-1 text-xs opacity-70">
                {t?.noInvoicesHint ?? 'Invoices sent to you will appear here'}
              </p>
            </div>
          )}

          {/* Liste */}
          {!isLoading && !error && invoices.length > 0 && (
            <div className="space-y-3">
              {invoices.map((invoice) => {
                const status = statusConfig[invoice.status];
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
                          variant={isOverdue ? 'destructive' : status.variant}
                          className="flex items-center gap-1 text-xs"
                        >
                          {status.icon}
                          {isOverdue ? (t?.statusOverdue ?? 'Overdue') : status.label}
                        </Badge>
                      </div>
                      <span className="text-sm">{invoice.description}</span>
                      <div className="text-muted-foreground flex gap-3 text-xs">
                        <span>
                          {t?.dueDateLabel ?? 'Due'}:{' '}
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                        {invoice.paidAt && (
                          <span className="text-green-600">
                            {t?.paidAtLabel ?? 'Paid on'}:{' '}
                            {new Date(invoice.paidAt).toLocaleDateString()}
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
                      <span className={`text-lg font-bold ${status.color}`}>
                        {invoice.currency} {invoice.amount.toFixed(2)}
                      </span>
                      <p className="text-muted-foreground text-xs">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </CardContent>
      </Card>
    </main>
  );
}