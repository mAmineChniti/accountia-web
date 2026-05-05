/* eslint-disable */
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Search,
  PlusCircle,
  MoreVertical,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Send,
  XCircle,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

import { type Dictionary } from '@/get-dictionary';
import {
  PurchaseOrdersService,
  VendorsService,
  ProductsService,
} from '@/lib/requests';
import type {
  PurchaseOrder,
  PurchaseOrderListResponse,
  POLineItem,
  VendorListResponse,
  ProductListResponse,
} from '@/types/services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  sent: 'bg-blue-100 text-blue-700',
  partially_received: 'bg-indigo-100 text-indigo-700',
  received: 'bg-teal-100 text-teal-700',
  closed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

type LineItemRow = {
  productId: string;
  productName: string;
  orderedQuantity: string;
  unitPrice: string;
};

const EMPTY_LINE: LineItemRow = {
  productId: '',
  productName: '',
  orderedQuantity: '1',
  unitPrice: '',
};

export function BusinessPurchaseOrders({
  businessId,
  dictionary,
}: {
  businessId: string;
  dictionary: Dictionary;
}) {
  const queryClient = useQueryClient();
  const d = dictionary.pages.businessPurchaseOrders;
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    poId: string | undefined;
  }>({ open: false, poId: undefined });
  const [rejectReason, setRejectReason] = useState('');
  const [receiveDialog, setReceiveDialog] = useState<{
    open: boolean;
    po: PurchaseOrder | undefined;
  }>({ open: false, po: undefined });
  const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>({});

  // Create PO form state
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    { ...EMPTY_LINE },
  ]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'business-purchase-orders',
      businessId,
      currentPage,
      statusFilter,
      search,
    ],
    queryFn: () =>
      PurchaseOrdersService.getPurchaseOrders({
        businessId,
        page: currentPage,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['business-vendors', businessId, 'all'],
    queryFn: () =>
      VendorsService.getVendors({ businessId, page: 1, limit: 100 }),
    staleTime: 5 * 60 * 1000,
    enabled: createOpen,
  });
  const vendors = (vendorsData as VendorListResponse)?.vendors ?? [];

  const { data: productsData } = useQuery({
    queryKey: ['products', businessId, 'all'],
    queryFn: () => ProductsService.getProducts(1, 100, businessId),
    staleTime: 5 * 60 * 1000,
    enabled: createOpen,
  });
  const products = (productsData as ProductListResponse)?.products ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      PurchaseOrdersService.createPurchaseOrder(payload),
    onSuccess: () => {
      toast.success('Purchase order created');
      queryClient.invalidateQueries({
        queryKey: ['business-purchase-orders', businessId],
      });
      resetCreateForm();
      setCreateOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create PO'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) =>
      PurchaseOrdersService.submitPurchaseOrder(id, businessId),
    onSuccess: () => {
      toast.success('PO submitted for approval');
      queryClient.invalidateQueries({
        queryKey: ['business-purchase-orders', businessId],
      });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to submit'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      PurchaseOrdersService.approvePurchaseOrder(id, { businessId }),
    onSuccess: () => {
      toast.success('PO approved');
      queryClient.invalidateQueries({
        queryKey: ['business-purchase-orders', businessId],
      });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      PurchaseOrdersService.approvePurchaseOrder(id, {
        businessId,
        rejectionReason: reason,
      }),
    onSuccess: () => {
      toast.success('PO rejected');
      queryClient.invalidateQueries({
        queryKey: ['business-purchase-orders', businessId],
      });
      setRejectDialog({ open: false, poId: undefined });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to reject'),
  });

  const receiveMutation = useMutation({
    mutationFn: ({ id, qtys }: { id: string; qtys: Record<string, number> }) =>
      PurchaseOrdersService.receiveGoods(id, {
        businessId,
        receivedQuantities: qtys,
      }),
    onSuccess: () => {
      toast.success('Goods receipt recorded');
      queryClient.invalidateQueries({
        queryKey: ['business-purchase-orders', businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ['business-vendors', businessId],
      });
      setReceiveDialog({ open: false, po: undefined });
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Failed to record receipt'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      PurchaseOrdersService.deletePurchaseOrder(id, businessId),
    onSuccess: () => {
      toast.success('PO deleted');
      queryClient.invalidateQueries({
        queryKey: ['business-purchase-orders', businessId],
      });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete'),
  });

  const pos = (data as PurchaseOrderListResponse)?.purchaseOrders ?? [];
  const totalPages = Math.ceil(
    ((data as PurchaseOrderListResponse)?.total ?? 0) / 10
  );

  const filtered = search
    ? pos.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
          po.vendorName.toLowerCase().includes(search.toLowerCase())
      )
    : pos;

  function resetCreateForm() {
    setVendorId('');
    setVendorName('');
    setExpectedDelivery('');
    setNotes('');
    setLineItems([{ ...EMPTY_LINE }]);
  }

  function updateLine(idx: number, field: keyof LineItemRow, val: string) {
    setLineItems((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: val } : l))
    );
  }

  function addLine() {
    setLineItems((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(idx: number) {
    setLineItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)
    );
  }

  let totalAmount = 0;
  for (const l of lineItems) {
    totalAmount +=
      (Number.parseFloat(l.orderedQuantity) || 0) *
      (Number.parseFloat(l.unitPrice) || 0);
  }

  function handleCreate() {
    if (!vendorId) {
      toast.error('Please select a vendor');
      return;
    }
    if (lineItems.some((l) => !l.productId)) {
      toast.error('Please select a product for every line item');
      return;
    }

    // Validate and parse line items
    const validatedLineItems = [];
    let calculatedTotal = 0;

    for (const [i, l] of lineItems.entries()) {
      const qty = Number.parseFloat(l.orderedQuantity);
      const price = Number.parseFloat(l.unitPrice);

      if (Number.isNaN(qty) || qty <= 0) {
        toast.error(
          `Line item ${i + 1}: Ordered quantity must be a positive number`
        );
        return;
      }
      if (Number.isNaN(price) || price <= 0) {
        toast.error(`Line item ${i + 1}: Unit price must be a positive number`);
        return;
      }

      const amount = qty * price;
      calculatedTotal += amount;

      validatedLineItems.push({
        productId: l.productId,
        productName: l.productName.trim(),
        orderedQuantity: qty,
        unitPrice: price,
        amount,
      });
    }

    const payload: Record<string, unknown> = {
      businessId,
      vendorId,
      vendorName,
      orderDate: new Date().toISOString(),
      lineItems: validatedLineItems,
      totalAmount: calculatedTotal,
      currency: 'TND',
    };
    if (expectedDelivery) payload.expectedDeliveryDate = expectedDelivery;
    if (notes.trim()) payload.notes = notes.trim();
    createMutation.mutate(payload);
  }

  function openReceive(po: PurchaseOrder) {
    const init: Record<string, string> = {};
    for (const item of po.lineItems) {
      if (item.id) init[item.id] = '0';
    }
    setReceivedQtys(init);
    setReceiveDialog({ open: true, po });
  }

  function handleReceive() {
    if (!receiveDialog.po) return;
    const qtys: Record<string, number> = {};

    for (const item of receiveDialog.po.lineItems) {
      if (!item.id) continue;

      const inputValue = receivedQtys[item.id] ?? '0';
      const parsedQty = Number.parseInt(inputValue, 10);

      // Validate that the input is a valid integer
      if (Number.isNaN(parsedQty)) {
        toast.error(
          `Invalid quantity for ${item.productName}: must be a number`
        );
        return;
      }

      // Calculate remaining quantity that can be received
      const remainingQty = item.orderedQuantity - (item.receivedQuantity ?? 0);

      // Clamp quantity to valid range [0, remainingQty]
      let validatedQty = Math.max(0, Math.min(parsedQty, remainingQty));

      // Ensure it's an integer
      validatedQty = Math.floor(validatedQty);

      if (validatedQty !== parsedQty) {
        toast.error(
          `Quantity for ${item.productName} adjusted to ${validatedQty} (must be between 0 and ${remainingQty})`
        );
        return;
      }

      qtys[item.id] = validatedQty;
    }

    receiveMutation.mutate({ id: receiveDialog.po.id, qtys });
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <span>{d.failedToLoad}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {d.retry}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{d.title}</h1>
          <p className="text-muted-foreground">{d.description}</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <PlusCircle className="h-4 w-4" /> {d.newPO}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={d.searchPlaceholder}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={d.allStatuses} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{d.allStatuses}</SelectItem>
            {Object.keys(STATUS_COLORS).map((s) => (
              <SelectItem key={s} value={s}>
                {s
                  .replaceAll('_', ' ')
                  .replaceAll(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ShoppingCart className="text-muted-foreground h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">{d.noPurchaseOrders}</p>
              <p className="text-muted-foreground text-sm">
                {d.noPurchaseOrdersHint}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 border-b hover:bg-transparent">
                    <TableHead className="font-semibold">
                      {d.columnPONumber ?? 'PO Number'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {d.columnVendor ?? 'Vendor'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {d.columnOrderDate ?? 'Order Date'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {d.columnExpected ?? 'Expected'}
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      {d.columnTotal}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {d.columnStatus ?? 'Status'}
                    </TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((po: PurchaseOrder) => {
                    const canReceive =
                      po.status === 'approved' ||
                      po.status === 'sent' ||
                      po.status === 'partially_received';
                    const hasActions =
                      po.status === 'draft' ||
                      po.status === 'pending_approval' ||
                      canReceive;
                    return (
                      <TableRow
                        key={po.id}
                        className="group hover:bg-primary/5 border-border/30 border-b transition-colors"
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {po.poNumber}
                        </TableCell>
                        <TableCell>{po.vendorName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(po.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {po.expectedDeliveryDate
                            ? new Date(
                                po.expectedDeliveryDate
                              ).toLocaleDateString()
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {po.totalAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}{' '}
                          {po.currency}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[po.status] ?? ''}`}
                          >
                            {po.status
                              .replaceAll('_', ' ')
                              .replaceAll(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </TableCell>
                        <TableCell>
                          {hasActions && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {po.status === 'draft' && (
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={() => submitMutation.mutate(po.id)}
                                  >
                                    <Send className="h-4 w-4" />{' '}
                                    {d.submitForApproval}
                                  </DropdownMenuItem>
                                )}
                                {po.status === 'pending_approval' && (
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2 text-green-700"
                                    onClick={() =>
                                      approveMutation.mutate(po.id)
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4" />{' '}
                                    {d.approve}
                                  </DropdownMenuItem>
                                )}
                                {po.status === 'pending_approval' && (
                                  <DropdownMenuItem
                                    className="text-destructive cursor-pointer gap-2"
                                    onClick={() => {
                                      setRejectReason('');
                                      setRejectDialog({
                                        open: true,
                                        poId: po.id,
                                      });
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" /> {d.reject}
                                  </DropdownMenuItem>
                                )}
                                {canReceive && (
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={() => openReceive(po)}
                                  >
                                    <Package className="h-4 w-4" />{' '}
                                    {d.receiveGoods}
                                  </DropdownMenuItem>
                                )}
                                {po.status === 'draft' && (
                                  <DropdownMenuItem
                                    className="text-destructive cursor-pointer gap-2"
                                    onClick={() => deleteMutation.mutate(po.id)}
                                  >
                                    <Trash2 className="h-4 w-4" /> {d.delete}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    {d.previous}
                  </Button>
                  <span className="text-sm">
                    {d.page
                      .replace('{page}', String(currentPage))
                      .replace('{totalPages}', String(totalPages))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    {d.next}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create PO Dialog ── */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) resetCreateForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{d.dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Vendor */}
            <div className="space-y-1">
              <Label>
                {d.vendorLabel} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={vendorId}
                onValueChange={(v) => {
                  const vendor = vendors.find((vv) => vv.id === v);
                  setVendorId(v);
                  setVendorName(vendor?.name ?? '');
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      vendors.length === 0
                        ? 'No vendors — add one first'
                        : 'Select vendor…'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery + Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{d.expectedDelivery}</Label>
                <Input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{d.notes}</Label>
                <Input
                  placeholder={d.notesPlaceholder ?? 'e.g. For new hires'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <Label>
                {d.lineItems} <span className="text-destructive">*</span>
              </Label>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left font-medium">
                        {d.lineItemDescription}
                      </th>
                      <th className="w-20 p-2 text-right font-medium">
                        {d.qty}
                      </th>
                      <th className="w-28 p-2 text-right font-medium">
                        {d.unitPrice}
                      </th>
                      <th className="w-24 p-2 text-right font-medium">
                        {d.amount}
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((line, idx) => {
                      const lineTotal =
                        (Number.parseFloat(line.orderedQuantity) || 0) *
                        (Number.parseFloat(line.unitPrice) || 0);
                      return (
                        <tr key={idx} className="border-t">
                          <td className="p-1">
                            <Select
                              value={line.productId}
                              onValueChange={(v) => {
                                const p = products.find((pr) => pr.id === v);
                                if (p) {
                                  setLineItems((prev) =>
                                    prev.map((l, i) =>
                                      i === idx
                                        ? {
                                            ...l,
                                            productId: p.id,
                                            productName: p.name,
                                            unitPrice: String(p.unitPrice),
                                          }
                                        : l
                                    )
                                  );
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 border-0 bg-transparent text-xs focus:ring-0">
                                <SelectValue
                                  placeholder={
                                    products.length === 0
                                      ? 'No products'
                                      : 'Select…'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} —{' '}
                                    {p.unitPrice.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                    })}{' '}
                                    TND
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              min="1"
                              className="h-8 w-full border-0 bg-transparent px-1 text-right focus-visible:ring-0"
                              value={line.orderedQuantity}
                              onChange={(e) =>
                                updateLine(
                                  idx,
                                  'orderedQuantity',
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="h-8 w-full border-0 bg-transparent px-1 text-right focus-visible:ring-0"
                              value={line.unitPrice}
                              onChange={(e) =>
                                updateLine(idx, 'unitPrice', e.target.value)
                              }
                            />
                          </td>
                          <td className="text-muted-foreground p-2 text-right">
                            {lineTotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-1 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive h-7 w-7"
                              onClick={() => removeLine(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t">
                    <tr>
                      <td colSpan={3} className="p-2 text-right font-semibold">
                        Total (TND)
                      </td>
                      <td className="p-2 text-right font-bold">
                        {totalAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={addLine}
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Line
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
            >
              {d.cancel}
            </Button>
            <Button disabled={createMutation.isPending} onClick={handleCreate}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                d.createPO
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(o) =>
          setRejectDialog({ open: o, poId: o ? rejectDialog.poId : undefined })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{d.rejectTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">{d.rejectHint}</p>
            <Input
              placeholder={d.rejectPlaceholder}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, poId: undefined })}
            >
              {d.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (!rejectDialog.poId) return;
                rejectMutation.mutate({
                  id: rejectDialog.poId,
                  reason: rejectReason,
                });
              }}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                d.rejectPO
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Receive Goods Dialog ── */}
      <Dialog
        open={receiveDialog.open}
        onOpenChange={(o) =>
          setReceiveDialog({ open: o, po: o ? receiveDialog.po : undefined })
        }
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {d.receiveTitle} — {receiveDialog.po?.poNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">{d.receiveHint}</p>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">
                      {d.columnItem}
                    </th>
                    <th className="w-20 p-2 text-right font-medium">
                      {d.columnOrdered}
                    </th>
                    <th className="w-24 p-2 text-right font-medium">
                      {d.columnAlreadyRcvd}
                    </th>
                    <th className="w-24 p-2 text-right font-medium">
                      {d.columnReceivingNow}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receiveDialog.po?.lineItems.map((item: POLineItem) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">{item.productName}</td>
                      <td className="text-muted-foreground p-2 text-right">
                        {item.orderedQuantity}
                      </td>
                      <td className="text-muted-foreground p-2 text-right">
                        {item.receivedQuantity ?? 0}
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          min="0"
                          max={
                            item.orderedQuantity - (item.receivedQuantity ?? 0)
                          }
                          className="h-8 w-full text-right"
                          value={item.id ? (receivedQtys[item.id] ?? '0') : '0'}
                          onChange={(e) =>
                            item.id &&
                            setReceivedQtys((prev) => ({
                              ...prev,
                              [item.id!]: e.target.value,
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReceiveDialog({ open: false, po: undefined })}
            >
              {d.cancel}
            </Button>
            <Button
              disabled={receiveMutation.isPending}
              onClick={handleReceive}
            >
              {receiveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                d.saveReceipt
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
