'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, AlertCircle, Calculator } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { type Dictionary } from '@/get-dictionary';
import { ReportsService } from '@/lib/requests';
import type { VatReportResponse } from '@/types/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Period = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export function VatReport({
  businessId,
  dictionary: _dictionary,
}: {
  businessId: string;
  dictionary: Dictionary;
}) {
  const currentDate = new Date();
  const [period, setPeriod] = useState<Period>('monthly');
  const [year, setYear] = useState(String(currentDate.getFullYear()));
  const [month, setMonth] = useState(String(currentDate.getMonth() + 1));
  const [quarter, setQuarter] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [enabled, setEnabled] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['vat-report', businessId, period, year, month, quarter, startDate, endDate],
    queryFn: () => ReportsService.getVatReport({ businessId, period, year, month, quarter, startDate, endDate }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const report = data as VatReportResponse | undefined;

  const handleGenerate = () => setEnabled(true);

  const exportPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(138, 34, 34);
    doc.text('Accountia', 14, 20);
    doc.setFontSize(14);
    doc.setTextColor(50);
    doc.text('VAT Compliance Report', 14, 30);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${new Date(report.startDate).toLocaleDateString()} — ${new Date(report.endDate).toLocaleDateString()}`, 14, 40);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 47);
    doc.setDrawColor(230, 230, 230);
    doc.line(14, 52, 196, 52);

    autoTable(doc, {
      head: [['Invoice #', 'Date', 'Client', 'Net', 'VAT (19%)', 'Gross', 'Status']],
      body: report.invoices.map((inv) => [
        inv.invoiceNumber,
        new Date(inv.issuedDate).toLocaleDateString(),
        inv.recipientName,
        `${inv.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND`,
        `${inv.totalVat.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND`,
        `${inv.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND`,
        inv.status,
      ]),
      startY: 60,
      headStyles: { fillColor: [138, 34, 34], textColor: 255 },
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 200;
    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.text('Summary', 14, finalY + 15);
    doc.setFontSize(10);
    doc.text(`Taxable Revenue: ${report.totalTaxableRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND`, 14, finalY + 25);
    doc.text(`Output VAT Collected: ${report.totalOutputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND`, 14, finalY + 32);
    doc.setFontSize(12);
    doc.setTextColor(138, 34, 34);
    doc.text(`Net VAT Payable: ${report.netVatPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND`, 14, finalY + 42);

    doc.save(`vat-report-${period}-${year}.pdf`);
  };

  const exportCSV = () => {
    if (!report) return;
    const headers = ['Invoice #', 'Date', 'Client', 'Net Amount', 'VAT Amount', 'Gross Amount', 'Status'];
    const rows = report.invoices.map((inv) => [
      inv.invoiceNumber,
      new Date(inv.issuedDate).toLocaleDateString(),
      `"${inv.recipientName}"`,
      inv.totalNet.toFixed(2),
      inv.totalVat.toFixed(2),
      inv.totalGross.toFixed(2),
      inv.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vat-report-${period}-${year}.csv`;
    a.click();
  };

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">VAT Compliance Reports</h1>
        <p className="text-muted-foreground">Generate VAT reports for tax filing. Standard Tunisia VAT rate: 19%</p>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
        <CardHeader><CardTitle className="text-base">Report Parameters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Period</Label>
              <Select value={period} onValueChange={(v) => { setPeriod(v as Period); setEnabled(false); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period !== 'custom' && (
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input value={year} onChange={(e) => { setYear(e.target.value); setEnabled(false); }} className="w-24" />
              </div>
            )}
            {period === 'monthly' && (
              <div className="space-y-1.5">
                <Label>Month</Label>
                <Select value={month} onValueChange={(v) => { setMonth(v); setEnabled(false); }}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={String(m)}>{new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {period === 'quarterly' && (
              <div className="space-y-1.5">
                <Label>Quarter</Label>
                <Select value={quarter} onValueChange={(v) => { setQuarter(v); setEnabled(false); }}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((q) => <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {period === 'custom' && (
              <>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setEnabled(false); }} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setEnabled(false); }} />
                </div>
              </>
            )}
            <Button onClick={handleGenerate} className="gap-2">
              <Calculator className="h-4 w-4" /> Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-64 w-full rounded-xl" />}

      {error && (
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to generate report</span>
        </div>
      )}

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Taxable Revenue', value: report.totalTaxableRevenue, color: 'text-blue-600' },
              { label: 'Output VAT Collected', value: report.totalOutputVat, color: 'text-green-600' },
              { label: 'Input VAT Paid', value: report.totalInputVat, color: 'text-orange-600' },
              { label: 'Net VAT Payable', value: report.netVatPayable, color: 'text-primary font-bold' },
            ].map((item) => (
              <Card key={item.label} className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-sm">{item.label}</p>
                  <p className={`mt-1 text-xl font-bold ${item.color}`}>
                    {item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" className="gap-2" onClick={exportCSV}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportPDF}>
              <FileText className="h-4 w-4" /> Export PDF
            </Button>
          </div>

          {/* Invoice Table */}
          <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
            <CardHeader>
              <CardTitle>VAT Breakdown — {report.invoices.length} Invoice{report.invoices.length !== 1 ? 's' : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              {report.invoices.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="text-muted-foreground mx-auto h-10 w-10 opacity-50" />
                  <p className="mt-2 text-muted-foreground">No invoices found for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-semibold">Invoice #</th>
                        <th className="pb-2 font-semibold">Date</th>
                        <th className="pb-2 font-semibold">Client</th>
                        <th className="pb-2 text-right font-semibold">Net Amount</th>
                        <th className="pb-2 text-right font-semibold">VAT (19%)</th>
                        <th className="pb-2 text-right font-semibold">Gross</th>
                        <th className="pb-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.invoices.map((inv) => (
                        <tr key={inv.invoiceId} className="border-b hover:bg-muted/50">
                          <td className="py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                          <td className="py-2">{new Date(inv.issuedDate).toLocaleDateString()}</td>
                          <td className="py-2">{inv.recipientName}</td>
                          <td className="py-2 text-right">{inv.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</td>
                          <td className="py-2 text-right text-orange-600">{inv.totalVat.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</td>
                          <td className="py-2 text-right font-medium">{inv.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</td>
                          <td className="py-2">
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 capitalize">{inv.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td colSpan={3} className="pt-2">Total</td>
                        <td className="pt-2 text-right">{report.totalTaxableRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</td>
                        <td className="pt-2 text-right text-orange-600">{report.totalOutputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</td>
                        <td className="pt-2 text-right">{(report.totalTaxableRevenue + report.totalOutputVat).toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
