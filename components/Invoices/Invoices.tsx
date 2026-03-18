'use client';

import Link from 'next/link';
import { Briefcase, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
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

type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'DRAFT' | 'CANCELLED';

interface StaticInvoice {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  notes?: string;
}

const STATIC_INVOICES: StaticInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2025-001',
    description: 'Web Development Services – Q1 2025',
    amount: 3200,
    currency: 'USD',
    status: 'PAID',
    dueDate: '2025-01-31',
    createdAt: '2025-01-10',
    paidAt: '2025-01-28',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2025-002',
    description: 'UI/UX Design – Dashboard Redesign',
    amount: 1750.5,
    currency: 'USD',
    status: 'PENDING',
    dueDate: '2025-03-15',
    createdAt: '2025-02-20',
    notes: 'Awaiting client approval',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2025-003',
    description: 'Monthly SaaS Subscription – February',
    amount: 499,
    currency: 'USD',
    status: 'OVERDUE',
    dueDate: '2025-02-28',
    createdAt: '2025-02-01',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2025-004',
    description: 'Logo & Branding Package',
    amount: 850,
    currency: 'USD',
    status: 'PAID',
    dueDate: '2025-02-10',
    createdAt: '2025-01-25',
    paidAt: '2025-02-08',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2025-005',
    description: 'API Integration – Payment Gateway',
    amount: 2100,
    currency: 'USD',
    status: 'DRAFT',
    dueDate: '2025-04-01',
    createdAt: '2025-03-01',
    notes: 'Draft – pending final scope confirmation',
  },
];

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

export default function Invoices({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const t = dictionary.pages.invoices;
  const invoices = STATIC_INVOICES;

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

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalInvoices}</CardDescription>
            <CardTitle className="text-2xl">{invoices.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalPaid}</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {currency} {totalPaid.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalPending}</CardDescription>
            <CardTitle className="text-2xl text-orange-500">
              {currency} {totalPending.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.invoiceList}
          </CardTitle>
          <Link href={`/${lang}/business-application`}>
            <Button size="sm" className="gap-2">
              <Briefcase className="h-4 w-4" />
              {t.createBusinessButton}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p className="text-sm">{t.noInvoices}</p>
              <p className="mt-1 text-xs opacity-70">{t.noInvoicesHint}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => {
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
                          {t.dueDateLabel}: {formatDate(invoice.dueDate, lang)}
                        </span>
                        {invoice.paidAt && (
                          <span className="text-green-600">
                            {t.paidAtLabel}: {formatDate(invoice.paidAt, lang)}
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
                        {invoice.currency} {invoice.amount.toFixed(2)}
                      </span>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(invoice.createdAt, lang)}
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
