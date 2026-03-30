'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar as CalendarIcon, 
  Filter,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

import { AdminStatsRequests } from '@/lib/requests';
import { type Dictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { cn } from '@/lib/utils';
import { formatDateLong, getCalendarLocale, getCalendarDirection } from '@/lib/date-utils';

export default function ReportsClient({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const t = dictionary.pages.reports;
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['filtered-transactions', dateRange, typeFilter],
    queryFn: () => AdminStatsRequests.getFilteredTransactions({
      startDate: dateRange?.from?.toISOString(),
      endDate: dateRange?.to?.toISOString(),
      type: typeFilter === 'all' ? undefined : typeFilter,
    }),
  });

  const totals = useMemo(() => {
    if (!transactions) return { revenue: 0, expenses: 0, profit: 0 };
    
    const revenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.revenue) || Number(t.amount) || 0), 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.expenditure) || Number(t.amount) || 0), 0);
      
    return {
      revenue,
      expenses,
      profit: revenue - expenses,
    };
  }, [transactions]);

  const exportCSV = () => {
    if (!transactions || transactions.length === 0) return;
    
    const headers = [t.table.date, t.table.type, t.table.amount];
    const rows = transactions.map(tr => [
      tr.date ? formatDateLong(new Date(tr.date)) : 'N/A',
      tr.type === 'income' ? t.filters.income : t.filters.expense,
      (Number(tr.revenue) || Number(tr.expenditure) || Number(tr.amount) || 0).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8 print:p-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t.export.csv}
          </Button>
          <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            {t.export.pdf}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {t.filters.dateRange}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal w-full md:w-auto',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={getCalendarLocale(lang)}
                    dir={getCalendarDirection(lang)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {t.filters.type}
              </label>
              <Tabs
                value={typeFilter}
                onValueChange={(v: any) => setTypeFilter(v)}
                className="w-full md:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">{t.filters.all}</TabsTrigger>
                  <TabsTrigger value="income">{t.filters.income}</TabsTrigger>
                  <TabsTrigger value="expense">{t.filters.expense}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm transition-all hover:shadow-md border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {t.summary.revenue}
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600">
              USD {totals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm transition-all hover:shadow-md border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              {t.summary.expenses}
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-red-600">
              USD {totals.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm transition-all hover:shadow-md border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              {t.summary.profit}
            </CardDescription>
            <CardTitle className={cn(
              "text-2xl font-bold",
              totals.profit >= 0 ? "text-primary" : "text-red-500"
            )}>
              USD {totals.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:pb-0">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.navReports}
          </CardTitle>
          <CardDescription className="print:hidden">
            {transactions?.length || 0} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.table.date}</TableHead>
                  <TableHead>{t.table.type}</TableHead>
                  <TableHead className="text-right">{t.table.amount}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">
                      {t.table.noData}
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions?.map((tr, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {tr.date ? formatDateLong(new Date(tr.date)) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tr.type === 'income' ? 'default' : 'secondary'} className="capitalize">
                          {tr.type === 'income' ? t.filters.income : t.filters.expense}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold tabular-nums",
                        tr.type === 'income' ? "text-green-600" : "text-red-600"
                      )}>
                        {tr.type === 'income' ? '+' : '-'} USD {(Number(tr.revenue) || Number(tr.expenditure) || Number(tr.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-muted-foreground pt-10 border-t mt-20">
        Generated by Accountia Financial Reporting System on {new Date().toLocaleString()}
      </div>
    </div>
  );
}
