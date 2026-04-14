'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Loader2, AlertCircle, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function ClientPortal({ token }: { token: string }) {
  const [selectedInvoice, setSelectedInvoice] = useState<string | undefined>(undefined);

  const { data: portalInfo, isLoading: infoLoading, error: infoError } = useQuery({
    queryKey: ['portal-info', token],
    queryFn: async () => {
      const url = API_CONFIG.CLIENT_PORTAL.VERIFY.replace('{token}', token);
      return publicClient.get(url).json<PortalInfo>();
    },
    retry: false,
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['portal-invoices', token],
    queryFn: async () => {
      const url = API_CONFIG.CLIENT_PORTAL.INVOICES.replace('{token}', token);
      return publicClient.get(url).json<PortalInvoice[]>();
    },
    enabled: !!portalInfo,
  });

  const { data: invoiceDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['portal-invoice-detail', token, selectedInvoice],
    queryFn: async () => {
      const url = API_CONFIG.CLIENT_PORTAL.INVOICE_DETAIL
        .replace('{token}', token)
        .replace('{invoiceId}', selectedInvoice!);
      return publicClient.get(url).json<PortalInvoice & { lineItems: Array<{ productName: string; quantity: number; unitPrice: number; amount: number }>; description?: string }>();
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
    doc.text(`Invoice ${inv.invoiceNumber}`, 14, 30);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Issued: ${new Date(inv.issuedDate).toLocaleDateString()}   Due: ${new Date(inv.dueDate).toLocaleDateString()}`, 14, 38);
    doc.line(14, 43, 196, 43);
    autoTable(doc, {
      head: [['Item', 'Qty', 'Unit Price', 'Amount']],
      body: (inv as unknown as { lineItems: Array<{ productName: string; quantity: number; unitPrice: number; amount: number }> }).lineItems.map((item) => [
        item.productName,
        item.quantity,
        `${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${inv.currency}`,
        `${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${inv.currency}`,
      ]),
      startY: 50,
      headStyles: { fillColor: [138, 34, 34] },
    });
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 200;
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`Total: ${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${inv.currency}`, 130, finalY + 10);
    doc.save(`invoice-${inv.invoiceNumber}.pdf`);
  };

  if (infoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (infoError || !portalInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">This portal link is invalid or has expired. Please contact your service provider for a new link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b shadow-sm dark:bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">Client Portal</h1>
            <p className="text-muted-foreground text-sm">Welcome, {portalInfo.clientName ?? portalInfo.clientEmail}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{portalInfo.clientEmail}</p>
            <p className="text-muted-foreground text-xs">Access expires: {new Date(portalInfo.expiresAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {selectedInvoice ? (
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setSelectedInvoice(undefined)}>← Back to Invoices</Button>
            {detailLoading ? <Skeleton className="h-64 w-full" /> : invoiceDetail && (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Invoice {invoiceDetail.invoiceNumber}</CardTitle>
                  <Button variant="outline" className="gap-2" onClick={() => exportPDF(invoiceDetail)}>
                    <Download className="h-4 w-4" /> Download PDF
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">From</p><p className="font-medium">{invoiceDetail.issuerBusinessName}</p></div>
                    <div><p className="text-muted-foreground">Status</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[invoiceDetail.status] ?? ''}`}>
                        {invoiceDetail.status}
                      </span>
                    </div>
                    <div><p className="text-muted-foreground">Issue Date</p><p>{new Date(invoiceDetail.issuedDate).toLocaleDateString()}</p></div>
                    <div><p className="text-muted-foreground">Due Date</p><p>{new Date(invoiceDetail.dueDate).toLocaleDateString()}</p></div>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="pb-2 text-left font-semibold">Item</th><th className="pb-2 text-right font-semibold">Qty</th><th className="pb-2 text-right font-semibold">Price</th><th className="pb-2 text-right font-semibold">Amount</th></tr></thead>
                    <tbody>
                      {(invoiceDetail as unknown as { lineItems: Array<{ productName: string; quantity: number; unitPrice: number; amount: number }> }).lineItems.map((item, i) => (
                        <tr key={i} className="border-b"><td className="py-2">{item.productName}</td><td className="py-2 text-right">{item.quantity}</td><td className="py-2 text-right">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} {invoiceDetail.currency}</td><td className="py-2 text-right font-medium">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {invoiceDetail.currency}</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr><td colSpan={3} className="pt-3 font-bold">Total</td><td className="pt-3 text-right font-bold text-lg">{invoiceDetail.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {invoiceDetail.currency}</td></tr></tfoot>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Invoices</h2>
            {invoicesLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : !invoices || invoices.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><FileText className="text-muted-foreground mx-auto h-10 w-10 opacity-50" /><p className="mt-2 text-muted-foreground">No invoices found</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv: PortalInvoice) => (
                  <Card key={inv.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedInvoice(inv.id)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-medium">{inv.invoiceNumber}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? ''}`}>{inv.status}</span>
                        </div>
                        <p className="text-muted-foreground text-sm">{inv.issuerBusinessName} · Issued {new Date(inv.issuedDate).toLocaleDateString()} · Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold">{inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {inv.currency}</span>
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
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
