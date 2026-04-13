'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt, Search, Loader2, AlertCircle, MoreVertical, Trash2, CheckCircle, XCircle,
  PlusCircle, TrendingUp, Clock, DollarSign,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { type Dictionary } from '@/get-dictionary';
import { ExpensesService } from '@/lib/requests';
import { CreateExpenseSchema, type CreateExpenseInput } from '@/types/services';
import type { Expense, ExpenseListResponse, ExpenseSummaryResponse } from '@/types/services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  submitted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  reimbursed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const CATEGORIES = [
  'travel', 'meals', 'accommodation', 'office_supplies',
  'software', 'hardware', 'marketing', 'utilities', 'professional_services', 'other',
];

export function BusinessExpenses({
  businessId,
  dictionary,
}: {
  businessId: string;
  dictionary: Dictionary;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; expenseId: string | undefined }>({ open: false, expenseId: undefined });
  const [rejectNote, setRejectNote] = useState('');

  const { data: expensesData, isLoading, error, refetch } = useQuery({
    queryKey: ['business-expenses', businessId, currentPage, statusFilter],
    queryFn: () => ExpensesService.getExpenses({ businessId, page: currentPage, limit: 10, status: statusFilter === 'all' ? undefined : statusFilter }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: summary } = useQuery({
    queryKey: ['expense-summary', businessId],
    queryFn: () => ExpensesService.getSummary(businessId),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(CreateExpenseSchema),
    defaultValues: { businessId, title: '', amount: 0, category: 'other', expenseDate: new Date().toISOString().split('T')[0], currency: 'TND', vendor: '', description: '' },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseInput) => ExpensesService.createExpense(data),
    onSuccess: () => {
      toast.success('Expense created successfully');
      queryClient.invalidateQueries({ queryKey: ['business-expenses', businessId] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary', businessId] });
      setCreateOpen(false);
      form.reset({ businessId, title: '', amount: 0, category: 'other', expenseDate: new Date().toISOString().split('T')[0], currency: 'TND', vendor: '', description: '' });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create expense'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => ExpensesService.submitExpense(id, businessId),
    onSuccess: () => {
      toast.success('Expense submitted for review');
      queryClient.invalidateQueries({ queryKey: ['business-expenses', businessId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to submit'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision, reviewNotes }: { id: string; decision: 'approved' | 'rejected'; reviewNotes?: string }) =>
      ExpensesService.reviewExpense(id, { businessId, decision, reviewNotes }),
    onSuccess: (_, { decision }) => {
      toast.success(decision === 'approved' ? 'Expense approved' : 'Expense rejected');
      queryClient.invalidateQueries({ queryKey: ['business-expenses', businessId] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary', businessId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to review'),
  });

  const reimburseMutation = useMutation({
    mutationFn: (id: string) => ExpensesService.markReimbursed(id, businessId),
    onSuccess: () => {
      toast.success('Expense marked as reimbursed');
      queryClient.invalidateQueries({ queryKey: ['business-expenses', businessId] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary', businessId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to reimburse'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ExpensesService.deleteExpense(id, businessId),
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['business-expenses', businessId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete'),
  });

  const expenses = (expensesData as ExpenseListResponse)?.expenses ?? [];
  const totalPages = expensesData ? Math.ceil((expensesData as ExpenseListResponse).total / 10) : 1;
  const summaryData = summary as ExpenseSummaryResponse;

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">Failed to load expenses</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track and manage business expenses with approval workflows</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><PlusCircle className="h-4 w-4" /> New Expense</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create Expense</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g. Team lunch" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount (TND)</FormLabel><FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="expenseDate" render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vendor" render={({ field }) => (
                  <FormItem><FormLabel>Vendor (optional)</FormLabel><FormControl><Input {...field} placeholder="e.g. Restaurant Name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Input {...field} placeholder="Additional notes" /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Expense'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summaryData && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><DollarSign className="h-4 w-4" />Total Spend</div>
              <p className="mt-1 text-2xl font-bold">{summaryData.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><Clock className="h-4 w-4" />Pending Review</div>
              <p className="mt-1 text-2xl font-bold">{summaryData.pendingReview ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><CheckCircle className="h-4 w-4 text-green-500" />Approved</div>
              <p className="mt-1 text-2xl font-bold">{summaryData.byStatus?.find((s) => s.status === 'approved')?.count ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUp className="h-4 w-4" />Reimbursed</div>
              <p className="mt-1 text-2xl font-bold">
                {summaryData.byStatus?.find((s) => s.status === 'reimbursed')?.total?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'} TND
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {['draft', 'submitted', 'approved', 'rejected', 'reimbursed'].map((s) => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Receipt className="text-muted-foreground h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">No expenses found</p>
              <p className="text-muted-foreground text-sm">Create your first expense to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 border-b hover:bg-transparent">
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Submitted By</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses
                    .filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()) || (e.vendor ?? '').toLowerCase().includes(search.toLowerCase()))
                    .map((expense: Expense) => (
                      <TableRow key={expense.id} className="group hover:bg-primary/5 border-border/30 border-b transition-colors">
                        <TableCell className="font-medium">
                          <div>{expense.title}</div>
                          {expense.vendor && <div className="text-muted-foreground text-xs">{expense.vendor}</div>}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{expense.category.replace('_', ' ')}</span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {expense.currency}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">{expense.submittedByName}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[expense.status] ?? ''}`}>
                            {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {(expense.status === 'draft' || expense.status === 'submitted' || expense.status === 'approved') && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {expense.status === 'draft' && (
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={() => submitMutation.mutate(expense.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-500" /> Submit for Review
                                  </DropdownMenuItem>
                                )}
                                {expense.status === 'submitted' && (
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2 text-green-700"
                                    onClick={() => reviewMutation.mutate({ id: expense.id, decision: 'approved' })}
                                  >
                                    <CheckCircle className="h-4 w-4" /> Approve
                                  </DropdownMenuItem>
                                )}
                                {expense.status === 'submitted' && (
                                  <DropdownMenuItem
                                    className="text-destructive cursor-pointer gap-2"
                                    onClick={() => { setRejectNote(''); setRejectDialog({ open: true, expenseId: expense.id }); }}
                                  >
                                    <XCircle className="h-4 w-4" /> Reject
                                  </DropdownMenuItem>
                                )}
                                {expense.status === 'approved' && (
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={() => reimburseMutation.mutate(expense.id)}
                                  >
                                    <TrendingUp className="h-4 w-4" /> Mark Reimbursed
                                  </DropdownMenuItem>
                                )}
                                {expense.status === 'draft' && (
                                  <DropdownMenuItem
                                    className="text-destructive cursor-pointer gap-2"
                                    onClick={() => deleteMutation.mutate(expense.id)}
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                )}
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

      {/* Reject expense dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, expenseId: open ? rejectDialog.expenseId : undefined })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Reject Expense</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">Optionally provide a reason so the submitter knows what to fix.</p>
            <Input
              placeholder="e.g. Use company account instead"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, expenseId: undefined })}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={reviewMutation.isPending}
              onClick={() => {
                if (!rejectDialog.expenseId) return;
                reviewMutation.mutate(
                  { id: rejectDialog.expenseId, decision: 'rejected', reviewNotes: rejectNote || undefined },
                  { onSuccess: () => setRejectDialog({ open: false, expenseId: undefined }) }
                );
              }}
            >
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
