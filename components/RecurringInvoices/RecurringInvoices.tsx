'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw, PauseCircle, PlayCircle, Trash2, MoreVertical, AlertCircle,
  Loader2, PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { type Dictionary } from '@/get-dictionary';
import { RecurringInvoicesService, ProductsService } from '@/lib/requests';
import type { RecurringInvoice, RecurringInvoiceListResponse, Product, ProductListResponse } from '@/types/services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
const END_CONDITIONS = [
  { value: 'never', label: 'Never (ongoing)' },
  { value: 'after_occurrences', label: 'After N invoices' },
  { value: 'by_date', label: 'By end date' },
];

type FormState = {
  name: string;
  frequency: string;
  startDate: string;
  endCondition: string;
  maxOccurrences: string;
  endDate: string;
  recipientName: string;
  recipientEmail: string;
  productName: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  dueDaysFromIssue: string;
  autoIssue: boolean;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  frequency: 'monthly',
  startDate: new Date().toISOString().split('T')[0],
  endCondition: 'never',
  maxOccurrences: '',
  endDate: '',
  recipientName: '',
  recipientEmail: '',
  productName: '',
  productId: '',
  quantity: '1',
  unitPrice: '',
  dueDaysFromIssue: '30',
  autoIssue: false,
  description: '',
};

export function RecurringInvoices({ businessId, dictionary }: { businessId: string; dictionary: Dictionary }) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['recurring-invoices', businessId, currentPage],
    queryFn: () => RecurringInvoicesService.getSchedules({ businessId, page: currentPage, limit: 10 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', businessId, 'all'],
    queryFn: () => ProductsService.getProducts(1, 100, businessId),
    staleTime: 5 * 60 * 1000,
    enabled: createOpen,
  });
  const products = (productsData as ProductListResponse)?.products ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => RecurringInvoicesService.create(payload),
    onSuccess: () => {
      toast.success('Recurring schedule created');
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', businessId] });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create schedule'),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => RecurringInvoicesService.update(id, { businessId, status: 'paused' }),
    onSuccess: () => {
      toast.success('Schedule paused');
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', businessId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to pause'),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => RecurringInvoicesService.update(id, { businessId, status: 'active' }),
    onSuccess: () => {
      toast.success('Schedule resumed');
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', businessId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to resume'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => RecurringInvoicesService.delete(id, businessId),
    onSuccess: () => {
      toast.success('Schedule deleted');
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', businessId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete'),
  });

  const schedules = (data as RecurringInvoiceListResponse)?.schedules ?? [];
  const totalPages = Math.ceil(((data as RecurringInvoiceListResponse)?.total ?? 0) / 10);

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const qty = parseFloat(form.quantity) || 1;
  const price = parseFloat(form.unitPrice) || 0;
  const lineAmount = qty * price;

  function handleCreate() {
    if (!form.name.trim()) { toast.error('Schedule name is required'); return; }
    if (!form.recipientEmail.trim()) { toast.error('Recipient email is required'); return; }
    if (!form.productId) { toast.error('Please select a product'); return; }
    if (price <= 0) { toast.error('Unit price must be greater than 0'); return; }

    const payload: Record<string, unknown> = {
      businessId,
      name: form.name.trim(),
      frequency: form.frequency,
      startDate: form.startDate,
      endCondition: form.endCondition,
      recipient: {
        displayName: form.recipientName.trim() || form.recipientEmail.trim(),
        email: form.recipientEmail.trim(),
      },
      lineItems: [{
        productId: form.productId || undefined,
        productName: form.productName.trim(),
        quantity: qty,
        unitPrice: price,
        amount: lineAmount,
      }],
      totalAmount: lineAmount,
      currency: 'TND',
      dueDaysFromIssue: parseInt(form.dueDaysFromIssue) || 30,
      autoIssue: form.autoIssue,
    };

    if (form.endCondition === 'after_occurrences' && form.maxOccurrences) {
      payload.maxOccurrences = parseInt(form.maxOccurrences);
    }
    if (form.endCondition === 'by_date' && form.endDate) {
      payload.endDate = form.endDate;
    }
    if (form.description.trim()) payload.description = form.description.trim();

    createMutation.mutate(payload);
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load recurring invoices</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Recurring Invoices</h1>
          <p className="text-muted-foreground">Automated billing schedules — invoices are generated automatically at each interval</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><PlusCircle className="h-4 w-4" /> New Schedule</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Recurring Schedule</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">

              {/* Name */}
              <div className="space-y-1">
                <Label>Schedule Name</Label>
                <Input placeholder="e.g. Monthly SaaS subscription" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>

              {/* Frequency + Start */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={(v) => set('frequency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </div>
              </div>

              {/* End Condition */}
              <div className="space-y-1">
                <Label>End Condition</Label>
                <Select value={form.endCondition} onValueChange={(v) => set('endCondition', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {END_CONDITIONS.map((ec) => (
                      <SelectItem key={ec.value} value={ec.value}>{ec.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.endCondition === 'after_occurrences' && (
                <div className="space-y-1">
                  <Label>Max Invoices</Label>
                  <Input type="number" min="1" placeholder="e.g. 12" value={form.maxOccurrences} onChange={(e) => set('maxOccurrences', e.target.value)} />
                </div>
              )}
              {form.endCondition === 'by_date' && (
                <div className="space-y-1">
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
                </div>
              )}

              {/* Recipient */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Recipient Name</Label>
                  <Input placeholder="Client company / person" value={form.recipientName} onChange={(e) => set('recipientName', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Recipient Email <span className="text-destructive">*</span></Label>
                  <Input type="email" placeholder="client@example.com" value={form.recipientEmail} onChange={(e) => set('recipientEmail', e.target.value)} />
                </div>
              </div>

              {/* Line item — product selector */}
              <div className="space-y-1">
                <Label>Product / Service <span className="text-destructive">*</span></Label>
                <Select
                  value={form.productId}
                  onValueChange={(v) => {
                    const selected = products.find((p: Product) => p.id === v);
                    if (selected) {
                      setForm((prev) => ({
                        ...prev,
                        productId: selected.id,
                        productName: selected.name,
                        unitPrice: String(selected.unitPrice),
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={products.length === 0 ? 'No products found — add products first' : 'Select a product…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: Product) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.productId && form.productName && (
                  <p className="text-muted-foreground text-xs">Selected: <strong>{form.productName}</strong></p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" step="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Unit Price (TND)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Amount</Label>
                  <Input readOnly value={lineAmount.toFixed(2)} className="bg-muted" />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Due Days After Issue</Label>
                  <Input type="number" min="0" value={form.dueDaysFromIssue} onChange={(e) => set('dueDaysFromIssue', e.target.value)} />
                </div>
                <div className="flex items-end gap-2 pb-0.5">
                  <input
                    type="checkbox"
                    id="autoIssue"
                    checked={form.autoIssue}
                    onChange={(e) => set('autoIssue', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="autoIssue" className="cursor-pointer leading-none">Auto-issue invoices</Label>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Description (optional)</Label>
                <Input placeholder="Internal notes..." value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setCreateOpen(false); setForm(EMPTY_FORM); }}>Cancel</Button>
              <Button disabled={createMutation.isPending} onClick={handleCreate}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <RefreshCw className="text-muted-foreground h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">No recurring schedules</p>
              <p className="text-muted-foreground text-sm">Click <strong>New Schedule</strong> to set up your first automated billing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 border-b hover:bg-transparent">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Frequency</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Next Run</TableHead>
                    <TableHead className="font-semibold">Generated</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule: RecurringInvoice) => (
                    <TableRow key={schedule.id} className="group hover:bg-primary/5 border-border/30 border-b transition-colors">
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell className="capitalize">{schedule.frequency}</TableCell>
                      <TableCell className="font-medium">
                        {schedule.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {schedule.currency}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {schedule.status === 'active' ? new Date(schedule.nextRunAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{schedule.occurrenceCount}</span>
                        {schedule.maxOccurrences && <span className="text-muted-foreground"> / {schedule.maxOccurrences}</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[schedule.status] ?? ''}`}>
                          {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {schedule.status === 'active' && (
                              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => pauseMutation.mutate(schedule.id)}>
                                <PauseCircle className="h-4 w-4" /> Pause
                              </DropdownMenuItem>
                            )}
                            {schedule.status === 'paused' && (
                              <DropdownMenuItem className="cursor-pointer gap-2 text-green-700" onClick={() => resumeMutation.mutate(schedule.id)}>
                                <PlayCircle className="h-4 w-4" /> Resume
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive cursor-pointer gap-2" onClick={() => deleteMutation.mutate(schedule.id)}>
                              <Trash2 className="h-4 w-4" /> Delete Schedule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 p-4">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</Button>
                  <span className="text-sm">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
