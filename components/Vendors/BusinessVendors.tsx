'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Search, PlusCircle, MoreVertical, Trash2, Loader2, AlertCircle, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { type Dictionary } from '@/get-dictionary';
import { VendorsService } from '@/lib/requests';
import type { Vendor, VendorListResponse } from '@/types/services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const CreateVendorSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(1, 'Vendor name is required'),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  paymentTermsDays: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type CreateVendorInput = z.infer<typeof CreateVendorSchema>;

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function BusinessVendors({ businessId, dictionary, canManage = true }: { businessId: string; dictionary: Dictionary; canManage?: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['business-vendors', businessId, currentPage, search],
    queryFn: () => VendorsService.getVendors({ businessId, page: currentPage, limit: 10, search: search || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<CreateVendorInput>({
    resolver: zodResolver(CreateVendorSchema),
    defaultValues: { businessId, name: '', paymentTermsDays: 30 },
  });

  const createMutation = useMutation({
    mutationFn: (d: CreateVendorInput) => VendorsService.createVendor(d as Record<string, unknown>),
    onSuccess: () => {
      toast.success('Vendor created');
      queryClient.invalidateQueries({ queryKey: ['business-vendors', businessId] });
      setCreateOpen(false);
      form.reset({ businessId, name: '', paymentTermsDays: 30 });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create vendor'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => VendorsService.deleteVendor(id, businessId),
    onSuccess: () => {
      toast.success('Vendor deleted');
      queryClient.invalidateQueries({ queryKey: ['business-vendors', businessId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete vendor'),
  });

  const vendors = (data as VendorListResponse)?.vendors ?? [];
  const total = (data as VendorListResponse)?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load vendors</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage your supplier and vendor catalog</p>
        </div>
        {canManage && <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Add Vendor</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Vendor Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="contactName" render={({ field }) => (
                    <FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="taxId" render={({ field }) => (
                    <FormItem><FormLabel>Tax ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="paymentTermsDays" render={({ field }) => (
                  <FormItem><FormLabel>Payment Terms (days)</FormLabel><FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 30)} />
                  </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Vendor'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>}
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input placeholder="Search vendors..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
      </div>

      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Building2 className="text-muted-foreground h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">No vendors yet</p>
              <p className="text-muted-foreground text-sm">Add your first vendor to start creating purchase orders</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 border-b hover:bg-transparent">
                    <TableHead className="font-semibold">Vendor</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">Payment Terms</TableHead>
                    <TableHead className="font-semibold">Orders</TableHead>
                    <TableHead className="font-semibold">Total Spend</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor: Vendor) => (
                    <TableRow key={vendor.id} className="group hover:bg-primary/5 border-border/30 border-b transition-colors">
                      <TableCell>
                        <div className="font-medium">{vendor.name}</div>
                        {vendor.taxId && <div className="text-muted-foreground text-xs">TIN: {vendor.taxId}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{vendor.contactName ?? '—'}</div>
                        {vendor.email && <div className="text-muted-foreground text-xs">{vendor.email}</div>}
                      </TableCell>
                      <TableCell>{vendor.paymentTermsDays} days</TableCell>
                      <TableCell>{vendor.totalOrders}</TableCell>
                      <TableCell className="font-medium">
                        {vendor.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[vendor.status] ?? ''}`}>
                          {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-destructive cursor-pointer gap-2" onClick={() => deleteMutation.mutate(vendor.id)}>
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
