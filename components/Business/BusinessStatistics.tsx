'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type Locale } from '@/i18n-config';
import { ApiError, BusinessService } from '@/lib/requests';
import { type BusinessStatisticsResponse } from '@/types/ResponseInterfaces';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type StatisticsUiText = {
  fetchError: string;
  noStatistics: string;
  noData: string;
  productStats: string;
  totalProducts: string;
  totalValue: string;
  lowStockProducts: string;
  lowStockHint: string;
  allInStockHint: string;
  invoiceStats: string;
  totalInvoices: string;
  paidInvoices: string;
  pendingInvoices: string;
  overdueInvoices: string;
  businessOverview: string;
  productsVsInvoices: string;
  count: string;
  invoiceDistribution: string;
  paidVsPendingVsOverdue: string;
  paid: string;
  pending: string;
  overdue: string;
  revenueSummary: string;
  byInvoiceStatus: string;
  lastUpdated: string;
};

function StatCard({
  title,
  value,
  subtitle,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantClasses = {
    default: 'bg-card border-border',
    success: 'bg-emerald-500/10 border-emerald-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    danger: 'bg-destructive/10 border-destructive/30',
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-foreground text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function BusinessStatistics({
  businessId,
  lang,
  text,
  errorMessages,
}: {
  businessId: string;
  lang: Locale;
  text: StatisticsUiText;
  errorMessages: Record<string, string>;
}) {
  const [statistics, setStatistics] = useState<
    BusinessStatisticsResponse | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: 'TND',
      }),
    [lang]
  );

  const formatMoney = (amount: number) => currencyFormatter.format(amount);

  useEffect(() => {
    let isCurrent = true;

    const fetchStatistics = async () => {
      setLoading(true);
      setError(undefined);

      try {
        const data = await BusinessService.getBusinessStatistics(businessId);
        if (!isCurrent) {
          return;
        }
        setStatistics(data);
      } catch (error_) {
        if (!isCurrent) {
          return;
        }

        const apiErrorType =
          error_ instanceof ApiError
            ? error_.type
            : typeof error_ === 'object' &&
                error_ !== null &&
                'type' in error_ &&
                typeof (error_ as { type?: unknown }).type === 'string'
              ? (error_ as { type: string }).type
              : undefined;

        const mappedError =
          apiErrorType === undefined ? undefined : errorMessages[apiErrorType];

        setError(mappedError ?? text.fetchError);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    void fetchStatistics();

    return () => {
      isCurrent = false;
    };
  }, [businessId, errorMessages, text.fetchError]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (statistics === undefined) {
    return (
      <Alert>
        <AlertDescription>{text.noStatistics}</AlertDescription>
      </Alert>
    );
  }

  const hasNoData =
    statistics.products.totalProducts === 0 &&
    statistics.products.totalValue === 0 &&
    statistics.invoices.totalInvoices === 0;

  return (
    <div className="space-y-6">
      {hasNoData && (
        <Alert>
          <AlertDescription>{text.noData}</AlertDescription>
        </Alert>
      )}

      <div>
        <h2 className="mb-4 text-lg font-bold">{text.productStats}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title={text.totalProducts}
            value={statistics.products.totalProducts}
          />
          <StatCard
            title={text.totalValue}
            value={formatMoney(statistics.products.totalValue)}
          />
          <StatCard
            title={text.lowStockProducts}
            value={statistics.products.lowStockProducts}
            variant={
              statistics.products.lowStockProducts > 0 ? 'warning' : 'default'
            }
            subtitle={
              statistics.products.lowStockProducts > 0
                ? text.lowStockHint
                : text.allInStockHint
            }
          />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">{text.invoiceStats}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={text.totalInvoices}
            value={statistics.invoices.totalInvoices}
          />
          <StatCard
            title={text.paidInvoices}
            value={statistics.invoices.paidInvoices}
            subtitle={formatMoney(statistics.invoices.paidAmount)}
            variant="success"
          />
          <StatCard
            title={text.pendingInvoices}
            value={statistics.invoices.pendingInvoices}
            subtitle={formatMoney(statistics.invoices.pendingAmount)}
          />
          <StatCard
            title={text.overdueInvoices}
            value={statistics.invoices.overdueInvoices}
            subtitle={formatMoney(statistics.invoices.overdueAmount)}
            variant={
              statistics.invoices.overdueInvoices > 0 ? 'danger' : 'default'
            }
          />
        </div>
      </div>

      {!hasNoData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">
                {text.businessOverview}
              </CardTitle>
              <CardDescription>{text.productsVsInvoices}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: text.count,
                      products: statistics.products.totalProducts,
                      invoices: statistics.invoices.totalInvoices,
                    },
                  ]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="products"
                    name={text.totalProducts}
                    fill="#10b981"
                  />
                  <Bar
                    dataKey="invoices"
                    name={text.totalInvoices}
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">
                {text.invoiceDistribution}
              </CardTitle>
              <CardDescription>{text.paidVsPendingVsOverdue}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: text.paid,
                        value: statistics.invoices.paidInvoices,
                        fill: '#10b981',
                      },
                      {
                        name: text.pending,
                        value: statistics.invoices.pendingInvoices,
                        fill: '#f59e0b',
                      },
                      {
                        name: text.overdue,
                        value: statistics.invoices.overdueInvoices,
                        fill: '#ef4444',
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    dataKey="value"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{text.revenueSummary}</CardTitle>
              <CardDescription>{text.byInvoiceStatus}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      status: text.paid,
                      amount: statistics.invoices.paidAmount,
                    },
                    {
                      status: text.pending,
                      amount: statistics.invoices.pendingAmount,
                    },
                    {
                      status: text.overdue,
                      amount: statistics.invoices.overdueAmount,
                    },
                  ]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="status"
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value) => formatMoney(value as number)}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#3b82f6"
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-xs text-gray-500">
        {text.lastUpdated}:{' '}
        {new Date(statistics.lastUpdated).toLocaleString(lang)}
      </div>
    </div>
  );
}
