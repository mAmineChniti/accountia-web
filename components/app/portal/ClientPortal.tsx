/* eslint-disable */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Loader2, AlertCircle, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { type Dictionary } from '@/get-dictionary';
import { publicClient, API_CONFIG } from '@/lib/requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  issuerBusinessName: string;
  totalAmount: number;
  currency: string;
  issuedDate: string;
  dueDate: string;
  status: string;
  amountPaid: number;
}

interface PortalInfo {
  clientEmail: string;
  clientName?: string;
  businessId: string;
  expiresAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  issued: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-gray-100 text-gray-700',
};

export function ClientPortal({
  token,
  dictionary,
}: {
  token: string;
  dictionary: Dictionary;
}) {
  const t = dictionary.pages.clientPortal;
  const [selectedInvoice, setSelectedInvoice] = useState<string | undefined>();

  const {
    data: portalInfo,
    isLoading: infoLoading,
    error: infoError,
  } = useQuery({
    queryKey: ['portal-info', token],
    queryFn: async () => {
      const url = API_CONFIG.CLIENT_PORTAL.VERIFY.replace('{token}', token);
      return publicClient.get(url).json<PortalInfo>();
    },
    retry: false,
  });

  const {
    data: invoices,
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: invoicesRefetch,
  } = useQuery({
    queryKey: ['portal-invoices', token],
    queryFn: async () => {
      const url = API_CONFIG.CLIENT_PORTAL.INVOICES.replace('{token}', token);
      return publicClient.get(url).json<PortalInvoice[]>();
    },
    enabled: !!portalInfo,
  });

  const {
    data: invoiceDetail,
    isLoading: detailLoading,
    error: detailError,
    refetch: detailRefetch,
  } = useQuery({
    queryKey: ['portal-invoice-detail', token, selectedInvoice],
    queryFn: async () => {
      const url = API_CONFIG.CLIENT_PORTAL.INVOICE_DETAIL.replace(
        '{token}',
        token
      ).replace('{invoiceId}', selectedInvoice!);
      return publicClient.get(url).json<
        PortalInvoice & {
          lineItems: Array<{
            productName: string;
            quantity: number;
            unitPrice: number;
            amount: number;
          }>;
          description?: string;
        }
      >();
    },
    enabled: !!selectedInvoice,
  });

  const exportPDF = (inv: typeof invoiceDetail) => {
    if (!inv) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(138, 34, 34);
    doc.text(inv.issuerBusinessName, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`${t.invoiceLabel} ${inv.invoiceNumber}`, 14, 30);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `${t.issued}: ${new Date(inv.issuedDate).toLocaleDateString()}   ${t.due}: ${new Date(inv.dueDate).toLocaleDateString()}`,
      14,
      38
    );
    doc.line(14, 43, 196, 43);
    autoTable(doc, {
      head: [[t.item, t.qty, t.price, t.amount]],
      body: (
        inv as unknown as {
          lineItems: Array<{
            productName: string;
            quantity: number;
            unitPrice: number;
            amount: number;
          }>;
        }
      ).lineItems.map((item) => [
        item.productName,
        item.quantity,
        `${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${inv.currency}`,
        `${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${inv.currency}`,
      ]),
      startY: 50,
      headStyles: { fillColor: [138, 34, 34] },
    });
    const finalY =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        ?.finalY ?? 200;
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(
      `${t.total}: ${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${inv.currency}`,
      130,
      finalY + 10
    );
    doc.save(`invoice-${inv.invoiceNumber}.pdf`);
  };

  if (infoLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (infoError || !portalInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="mx-4 w-full max-w-md">
          <CardContent className="space-y-3 p-8 text-center">
            <AlertCircle className="text-destructive mx-auto h-12 w-12" />
            <h2 className="text-xl font-semibold">{t.accessDeniedTitle}</h2>
            <p className="text-muted-foreground">{t.accessDeniedDescription}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="dark:bg-card border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-primary text-xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground text-sm">
              {t.welcome.replace(
                '{name}',
                portalInfo.clientName ?? portalInfo.clientEmail
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{portalInfo.clientEmail}</p>
            <p className="text-muted-foreground text-xs">
              {t.accessExpires}{' '}
              {new Date(portalInfo.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {selectedInvoice ? (
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setSelectedInvoice(undefined)}
            >
              ← {t.backToInvoices}
            </Button>
            {detailError ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="text-destructive mx-auto h-10 w-10 opacity-50" />
                  <p className="text-destructive mt-2">
                    {t.failedToLoadInvoice || 'Failed to load invoice details'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => detailRefetch()}
                  >
                    {t.retry || 'Retry'}
                  </Button>
                </CardContent>
              </Card>
            ) : detailLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              invoiceDetail && (
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>
                      {t.invoiceLabel} {invoiceDetail.invoiceNumber}
                    </CardTitle>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => exportPDF(invoiceDetail)}
                    >
                      <Download className="h-4 w-4" /> {t.downloadPdf}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t.from}</p>
                        <p className="font-medium">
                          {invoiceDetail.issuerBusinessName}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t.status}</p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[invoiceDetail.status] ?? ''}`}
                        >
                          {invoiceDetail.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t.issueDate}</p>
                        <p>
                          {new Date(
                            invoiceDetail.issuedDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t.dueDate}</p>
                        <p>
                          {new Date(invoiceDetail.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-semibold">
                            {t.item}
                          </th>
                          <th className="pb-2 text-right font-semibold">
                            {t.qty}
                          </th>
                          <th className="pb-2 text-right font-semibold">
                            {t.price}
                          </th>
                          <th className="pb-2 text-right font-semibold">
                            {t.amount}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          invoiceDetail as unknown as {
                            lineItems: Array<{
                              productName: string;
                              quantity: number;
                              unitPrice: number;
                              amount: number;
                            }>;
                          }
                        ).lineItems.map((item, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-2">{item.productName}</td>
                            <td className="py-2 text-right">{item.quantity}</td>
                            <td className="py-2 text-right">
                              {item.unitPrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}{' '}
                              {invoiceDetail.currency}
                            </td>
                            <td className="py-2 text-right font-medium">
                              {item.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}{' '}
                              {invoiceDetail.currency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="pt-3 font-bold">
                            {t.total}
                          </td>
                          <td className="pt-3 text-right text-lg font-bold">
                            {invoiceDetail.totalAmount.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                              }
                            )}{' '}
                            {invoiceDetail.currency}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t.yourInvoices}</h2>
            {invoicesError ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="text-destructive mx-auto h-10 w-10 opacity-50" />
                  <p className="text-destructive mt-2">
                    {t.failedToLoadInvoices || 'Failed to load invoices'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => invoicesRefetch()}
                  >
                    {t.retry || 'Retry'}
                  </Button>
                </CardContent>
              </Card>
            ) : invoicesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !invoices || invoices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="text-muted-foreground mx-auto h-10 w-10 opacity-50" />
                  <p className="text-muted-foreground mt-2">{t.noInvoices}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv: PortalInvoice) => (
                  <Card
                    key={inv.id}
                    tabIndex={0}
                    role="button"
                    className="hover:border-primary/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedInvoice(inv.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedInvoice(inv.id);
                      }
                    }}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-medium">
                            {inv.invoiceNumber}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? ''}`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {inv.issuerBusinessName} · {t.issued}{' '}
                          {new Date(inv.issuedDate).toLocaleDateString()} ·{' '}
                          {t.due} {new Date(inv.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold">
                          {inv.totalAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}{' '}
                          {inv.currency}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`View invoice ${inv.invoiceNumber}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(inv.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
