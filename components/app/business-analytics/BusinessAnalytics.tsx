'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { type Dictionary } from '@/get-dictionary';
import { AnalyticsService } from '@/lib/requests';
import type { AnalyticsDashboardResponse } from '@/types/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function BusinessAnalytics({
  businessId,
  dictionary,
}: {
  businessId: string;
  dictionary: Dictionary;
}) {
  const t = dictionary.pages.businessAnalytics;
  const [groupBy, setGroupBy] = useState<'monthly' | 'weekly' | 'yearly'>(
    'monthly'
  );
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
  const currency = dashboard?.summary?.currency ?? 'TND';
  const maxArAmount = Math.max(
    ...(dashboard?.arAging ?? []).map((b) => b.amount),
    1
  );

  const getForecastStatusLabel = (status: string) =>
    status === 'overdue' ? t.statusOverdue : t.statusOnTrack;

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <span>{t.failedLoad}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Select
          value={groupBy}
          onValueChange={(v) => setGroupBy(v as typeof groupBy)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t.groupBy.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">{t.groupBy.monthly}</SelectItem>
            <SelectItem value="weekly">{t.groupBy.weekly}</SelectItem>
            <SelectItem value="yearly">{t.groupBy.yearly}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        dashboard?.summary && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <DollarSign className="h-4 w-4" />
                  {t.totalRevenue}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {dashboard.summary.totalRevenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}{' '}
                  {currency}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t.ytd} {year}
                </p>
              </CardContent>
            </Card>
            <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <Clock className="h-4 w-4" />
                  {t.outstanding}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {dashboard.summary.totalOutstanding.toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 }
                  )}{' '}
                  {currency}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t.awaitingPayment}
                </p>
              </CardContent>
            </Card>
            <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {t.overdue}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {dashboard.summary.totalOverdue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}{' '}
                  {currency}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t.pastDueDate}
                </p>
              </CardContent>
            </Card>
            <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <TrendingUp className="h-4 w-4" />
                  {t.collectionRate}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {dashboard.summary.collectionRate.toFixed(1)}%
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t.averageDaysToPayPrefix}{' '}
                  {dashboard.summary.averageDaysToPay.toFixed(0)}{' '}
                  {t.averageDaysToPaySuffix}
                </p>
              </CardContent>
            </Card>
          </div>
        )
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Timeline */}
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t.revenueTimeline}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dashboard?.revenueTimeline ?? []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) =>
                      `${(v as number)?.toLocaleString() ?? 0} ${currency}`
                    }
                  />
                  <Bar
                    dataKey="paid"
                    name={t.paid}
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="unpaid"
                    name={t.unpaid}
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* AR Aging */}
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>{t.arAging}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-3">
                {(dashboard?.arAging ?? []).map((bucket, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{bucket.label}</span>
                        <span className="font-medium">
                          {bucket.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}{' '}
                          {currency} ({bucket.count})
                        </span>
                      </div>
                      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full transition-all ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-500' : i === 2 ? 'bg-orange-500' : 'bg-red-500'}`}
                          style={{
                            width: `${Math.min(100, (bucket.amount / maxArAmount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {(dashboard?.arAging?.every((b) => b.amount === 0) ?? true) && (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    {t.noOutstandingReceivables}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Forecast */}
      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>{t.cashFlowForecast}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : dashboard?.cashFlowForecast &&
            dashboard.cashFlowForecast.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-semibold">{t.dueDate}</th>
                    <th className="pb-2 font-semibold">{t.invoice}</th>
                    <th className="pb-2 font-semibold">{t.client}</th>
                    <th className="pb-2 text-right font-semibold">
                      {t.expectedInflow}
                    </th>
                    <th className="pb-2 font-semibold">{t.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.cashFlowForecast.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/50 border-b">
                      <td className="py-2">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="py-2 font-mono text-xs">
                        {item.invoiceNumber}
                      </td>
                      <td className="py-2">{item.recipientName}</td>
                      <td className="py-2 text-right font-medium text-green-600">
                        {item.expectedInflow.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{' '}
                        {currency}
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${item.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
                        >
                          {getForecastStatusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t.noOutstandingInvoices}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Clients */}
      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>{t.topClients}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : dashboard?.topClients && dashboard.topClients.length > 0 ? (
            <div className="space-y-3">
              {dashboard.topClients.slice(0, 5).map((client, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{client.clientName}</span>
                      <span className="font-medium">
                        {client.totalRevenue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{' '}
                        {currency}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {client.invoiceCount} {t.invoices}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t.noClientDataYet}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
