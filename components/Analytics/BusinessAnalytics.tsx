'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, DollarSign, AlertTriangle, Clock, BarChart3, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

import { type Dictionary } from '@/get-dictionary';
import { AnalyticsService } from '@/lib/requests';
import type { AnalyticsDashboardResponse } from '@/types/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const PIE_COLORS = ['#8a2222', '#d44f4f', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1'];

export function BusinessAnalytics({
  businessId,
  dictionary: _dictionary,
}: {
  businessId: string;
  dictionary: Dictionary;
}) {
  const [groupBy, setGroupBy] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const currentYear = new Date().getFullYear();
  const [year] = useState(currentYear);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['business-analytics', businessId, groupBy, year],
    queryFn: () =>
      AnalyticsService.getDashboard({
        businessId,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        groupBy,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const dashboard = data as AnalyticsDashboardResponse | undefined;

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load analytics</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Cash Flow</h1>
          <p className="text-muted-foreground">Financial insights, AR aging, and 90-day cash flow forecast</p>
        </div>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : dashboard?.summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-green-600"><DollarSign className="h-4 w-4" />Total Revenue</div>
              <p className="mt-1 text-2xl font-bold">{dashboard.summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</p>
              <p className="text-muted-foreground text-xs mt-1">YTD {year}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-yellow-600"><Clock className="h-4 w-4" />Outstanding</div>
              <p className="mt-1 text-2xl font-bold">{dashboard.summary.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</p>
              <p className="text-muted-foreground text-xs mt-1">Awaiting payment</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-red-600"><AlertTriangle className="h-4 w-4" />Overdue</div>
              <p className="mt-1 text-2xl font-bold">{dashboard.summary.totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</p>
              <p className="text-muted-foreground text-xs mt-1">Past due date</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-blue-600"><TrendingUp className="h-4 w-4" />Collection Rate</div>
              <p className="mt-1 text-2xl font-bold">{dashboard.summary.collectionRate.toFixed(1)}%</p>
              <p className="text-muted-foreground text-xs mt-1">Avg {dashboard.summary.averageDaysToPay.toFixed(0)} days to pay</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Timeline */}
        <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Revenue Timeline</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dashboard?.revenueTimeline ?? []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString()} TND`} />
                  <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unpaid" name="Unpaid" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* AR Aging */}
        <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
          <CardHeader><CardTitle>Accounts Receivable Aging</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-3">
                {(dashboard?.arAging ?? []).map((bucket, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between text-sm">
                        <span>{bucket.label}</span>
                        <span className="font-medium">{bucket.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND ({bucket.count})</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-500' : i === 2 ? 'bg-orange-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, (bucket.amount / Math.max(...(dashboard?.arAging ?? []).map((b) => b.amount), 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {(dashboard?.arAging?.every((b) => b.amount === 0) ?? true) && (
                  <p className="text-muted-foreground text-center py-8 text-sm">No outstanding receivables</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Forecast */}
      <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
        <CardHeader><CardTitle>90-Day Cash Flow Forecast</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            dashboard?.cashFlowForecast && dashboard.cashFlowForecast.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-semibold">Due Date</th>
                      <th className="pb-2 font-semibold">Invoice</th>
                      <th className="pb-2 font-semibold">Client</th>
                      <th className="pb-2 font-semibold text-right">Expected Inflow</th>
                      <th className="pb-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.cashFlowForecast.map((item, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="py-2">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="py-2 font-mono text-xs">{item.invoiceNumber}</td>
                        <td className="py-2">{item.recipientName}</td>
                        <td className="py-2 text-right font-medium text-green-600">{item.expectedInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</td>
                        <td className="py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${item.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No outstanding invoices in the next 90 days</p>
            )
          )}
        </CardContent>
      </Card>

      {/* Top Clients */}
      <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
        <CardHeader><CardTitle>Top Clients by Revenue</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            dashboard?.topClients && dashboard.topClients.length > 0 ? (
              <div className="space-y-3">
                {dashboard.topClients.slice(0, 5).map((client, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{client.clientName}</span>
                        <span className="font-medium">{client.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</span>
                      </div>
                      <div className="text-muted-foreground text-xs">{client.invoiceCount} invoices</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No client data yet</p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
