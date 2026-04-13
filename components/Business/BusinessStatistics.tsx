'use client';

import { type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Label,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { BusinessService, ProductsService } from '@/lib/requests';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Chatbot } from '@/components/Business/Chatbot';

export default function BusinessStatistics({
  businessId,
  dictionary,
  lang,
}: {
  businessId: string;
  dictionary: Dictionary;
  lang: Locale;
}) {
  const t = dictionary.pages.business;
  const text = t.statisticsUi;

  const formatMoney = (amount: number, currency?: string) =>
    new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: currency ?? 'TND',
    }).format(amount);

  const {
    data: statistics,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['business-statistics', businessId],
    queryFn: () => BusinessService.getBusinessStatistics(businessId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: stockInsights, isLoading: stockInsightsLoading } = useQuery({
    queryKey: ['product-stock-insights', businessId],
    queryFn: () => ProductsService.getStockInsights(businessId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const invoiceDistributionConfig = {
    paid: {
      label: text.paid,
      color: '#10b981',
    },
    pending: {
      label: text.pending,
      color: '#f59e0b',
    },
    overdue: {
      label: text.overdue,
      color: '#ef4444',
    },
  } satisfies ChartConfig;

  const profitabilityConfig = {
    profit: {
      label: text.profit,
      color: '#10b981',
    },
    revenue: {
      label: text.revenue,
      color: '#0ea5e9',
    },
  } satisfies ChartConfig;

  const cashflowConfig = {
    paidAmount: {
      label: text.paid,
      color: '#10b981',
    },
    pendingAmount: {
      label: text.pending,
      color: '#f59e0b',
    },
    overdueAmount: {
      label: text.overdue,
      color: '#ef4444',
    },
  } satisfies ChartConfig;

  const healthConfig = {
    collected: {
      label: text.collected,
      color: '#10b981',
    },
    open: {
      label: text.open,
      color: '#e5e7eb',
    },
  } satisfies ChartConfig;

  let content: ReactNode;

  if (error) {
    content = (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{text.fetchError}</AlertDescription>
      </Alert>
    );
  } else if (loading) {
    content = (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="dark:bg-card/90 space-y-3 rounded-lg border-0 bg-white/90 p-4 shadow-sm"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  } else if (statistics === undefined) {
    content = (
      <Alert>
        <AlertDescription>{text.noStatistics}</AlertDescription>
      </Alert>
    );
  } else {
    const profitability = statistics.productProfitability ?? [];
    const profitabilityWithSales = profitability.filter(
      (item) => item.soldQuantity > 0
    );
    const totalRevenue = profitabilityWithSales.reduce(
      (sum, item) => sum + item.revenue,
      0
    );
    const totalGrossProfit = profitabilityWithSales.reduce(
      (sum, item) => sum + item.grossProfit,
      0
    );
    const overallProfitMargin =
      totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    const topProfitableProducts = profitabilityWithSales
      .toSorted((a, b) => b.grossProfit - a.grossProfit)
      .slice(0, 5);
    const invoiceStatusData = [
      {
        status: 'paid',
        value: statistics.invoices.paidInvoices,
        fill: 'var(--color-paid)',
      },
      {
        status: 'pending',
        value: statistics.invoices.pendingInvoices,
        fill: 'var(--color-pending)',
      },
      {
        status: 'overdue',
        value: statistics.invoices.overdueInvoices,
        fill: 'var(--color-overdue)',
      },
    ];
    const invoiceAmountData = [
      {
        bucket: text.paid,
        paidAmount: statistics.invoices.paidAmount,
        pendingAmount: 0,
        overdueAmount: 0,
      },
      {
        bucket: text.pending,
        paidAmount: 0,
        pendingAmount: statistics.invoices.pendingAmount,
        overdueAmount: 0,
      },
      {
        bucket: text.overdue,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: statistics.invoices.overdueAmount,
      },
    ];

    const hasNoData =
      statistics.products.totalProducts === 0 &&
      statistics.products.totalValue === 0 &&
      statistics.invoices.totalInvoices === 0;
    const totalInvoiceAmount =
      statistics.invoices.paidAmount +
      statistics.invoices.pendingAmount +
      statistics.invoices.overdueAmount;
    const collectionRate =
      totalInvoiceAmount > 0
        ? (statistics.invoices.paidAmount / totalInvoiceAmount) * 100
        : 0;
    const openAmount =
      statistics.invoices.pendingAmount + statistics.invoices.overdueAmount;
    const productCoverage =
      statistics.products.totalProducts > 0
        ? ((statistics.products.totalProducts -
            statistics.products.lowStockProducts) /
            statistics.products.totalProducts) *
          100
        : 100;
    const openInvoicesCount =
      statistics.invoices.pendingInvoices + statistics.invoices.overdueInvoices;
    const pendingInvoicesCount =
      statistics.invoices.pendingInvoices ??
      openInvoicesCount - statistics.invoices.overdueInvoices;
    const marginLeaders = profitabilityWithSales
      .toSorted((a, b) => b.profitMarginPercent - a.profitMarginPercent)
      .slice(0, 4);
    const collectionDonutData = [
      {
        status: 'collected',
        value: Number(collectionRate.toFixed(2)),
        fill: 'var(--color-collected)',
      },
      {
        status: 'open',
        value: Number((100 - collectionRate).toFixed(2)),
        fill: 'var(--color-open)',
      },
    ];
    const resolvedCurrency =
      (statistics as { currency?: string }).currency ?? 'TND';

    content = (
      <>
        {hasNoData && (
          <Alert>
            <AlertDescription>{text.noData}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border/60 bg-card/95 border shadow-sm">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
                {statistics.businessName}
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {text.businessPerformanceSnapshot}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="border-border bg-muted/40 rounded-full border px-3 py-1.5">
                  {statistics.invoices.totalInvoices} {text.totalInvoices}
                </span>
                <span className="border-border bg-muted/40 rounded-full border px-3 py-1.5">
                  {formatMoney(
                    statistics.invoices.paidAmount,
                    resolvedCurrency
                  )}{' '}
                  {text.collected}
                </span>
                <span className="border-border bg-muted/40 rounded-full border px-3 py-1.5">
                  {statistics.products.totalProducts} {text.totalProducts}
                </span>
              </div>
            </div>
            <div className="border-border bg-muted/30 space-y-3 rounded-lg border p-4">
              <p className="text-muted-foreground text-xs">
                {text.collectionRate}
              </p>
              <p className="text-3xl font-semibold">
                {collectionRate.toFixed(1)}%
              </p>
              <div className="bg-muted h-1.5 rounded-full">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                />
              </div>
            </div>
            <div className="border-border bg-muted/30 space-y-3 rounded-lg border p-4">
              <p className="text-muted-foreground text-xs">
                {text.stockReadiness}
              </p>
              <p className="text-3xl font-semibold">
                {productCoverage.toFixed(1)}%
              </p>
              <div className="bg-muted h-1.5 rounded-full">
                <div
                  className="bg-secondary h-1.5 rounded-full"
                  style={{ width: `${Math.min(productCoverage, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {!hasNoData && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Card className="bg-card/90 border-0 shadow-sm xl:col-span-4">
              <CardHeader>
                <CardTitle className="text-base">{text.invoiceMix}</CardTitle>
                <CardDescription>{text.paidVsPendingVsOverdue}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={invoiceDistributionConfig}
                  className="aspect-auto h-[270px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      dataKey="value"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={102}
                      paddingAngle={3}
                      cornerRadius={10}
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={2}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (
                            !viewBox ||
                            !('cx' in viewBox) ||
                            !('cy' in viewBox)
                          ) {
                            return;
                          }

                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-xl font-semibold"
                              >
                                {statistics.invoices.totalInvoices}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 20}
                                className="fill-muted-foreground text-xs"
                              >
                                {text.totalInvoices}
                              </tspan>
                            </text>
                          );
                        }}
                      />
                    </Pie>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent hideLabel nameKey="status" />
                      }
                    />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="status" />}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/90 border-0 shadow-sm xl:col-span-4">
              <CardHeader>
                <CardTitle className="text-base">
                  {text.cashCollectionHealth}
                </CardTitle>
                <CardDescription>{text.paidVsOpenReceivables}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={healthConfig}
                  className="aspect-auto h-[270px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={collectionDonutData}
                      dataKey="value"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={102}
                      paddingAngle={2}
                      cornerRadius={10}
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={2}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (
                            !viewBox ||
                            !('cx' in viewBox) ||
                            !('cy' in viewBox)
                          ) {
                            return;
                          }

                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-xl font-semibold"
                              >
                                {collectionRate.toFixed(1)}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 20}
                                className="fill-muted-foreground text-xs"
                              >
                                {text.collectionRate}
                              </tspan>
                            </text>
                          );
                        }}
                      />
                    </Pie>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${Number(value).toFixed(1)}%`}
                          nameKey="status"
                        />
                      }
                    />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="status" />}
                    />
                  </PieChart>
                </ChartContainer>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/30 rounded-md border p-3">
                    <p className="text-muted-foreground text-xs">
                      {text.collected}
                    </p>
                    <p className="font-semibold">
                      {formatMoney(
                        statistics.invoices.paidAmount,
                        resolvedCurrency
                      )}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-md border p-3">
                    <p className="text-muted-foreground text-xs">
                      {text.openAmount}
                    </p>
                    <p className="font-semibold">
                      {formatMoney(openAmount, resolvedCurrency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/90 border-0 shadow-sm xl:col-span-4">
              <CardHeader>
                <CardTitle className="text-base">
                  {text.operationalSignals}
                </CardTitle>
                <CardDescription>{text.quickRiskIndicators}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 rounded-lg border p-4">
                  <p className="text-muted-foreground text-xs">
                    {text.pendingInvoices}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {pendingInvoicesCount}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {text.overdueInvoices}:{' '}
                    {statistics.invoices.overdueInvoices}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg border p-4">
                  <p className="text-muted-foreground text-xs">
                    {text.lowStockProducts}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {statistics.products.lowStockProducts}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {statistics.products.lowStockProducts > 0
                      ? text.lowStockHint
                      : text.allInStockHint}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg border p-4">
                  <p className="text-muted-foreground text-xs">
                    {text.grossProfit}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatMoney(totalGrossProfit, resolvedCurrency)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {text.margin}: {overallProfitMargin.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/90 border-0 shadow-sm xl:col-span-7">
              <CardHeader>
                <CardTitle className="text-base">
                  {text.invoiceValueLandscape}
                </CardTitle>
                <CardDescription>{text.amountsByStatus}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={cashflowConfig}
                  className="aspect-auto h-[300px] w-full"
                >
                  <AreaChart
                    data={invoiceAmountData}
                    margin={{ left: 8, right: 8 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `${Math.round(Number(value) / 1000)}k`
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value) =>
                            formatMoney(Number(value), resolvedCurrency)
                          }
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="paidAmount"
                      stroke="var(--color-paidAmount)"
                      fill="var(--color-paidAmount)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="pendingAmount"
                      stroke="var(--color-pendingAmount)"
                      fill="var(--color-pendingAmount)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="overdueAmount"
                      stroke="var(--color-overdueAmount)"
                      fill="var(--color-overdueAmount)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/90 border-0 shadow-sm xl:col-span-5">
              <CardHeader>
                <CardTitle className="text-base">
                  {text.performanceNotes}
                </CardTitle>
                <CardDescription>{text.focusAreas}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">
                    {text.receivablesExposure}
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatMoney(openAmount, resolvedCurrency)} -{' '}
                    {openInvoicesCount} {text.openInvoices}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">
                    {text.profitabilityCoverage}
                  </p>
                  <p className="mt-1 font-semibold">
                    {profitabilityWithSales.length}{' '}
                    {text.productsGeneratedPaidSales}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">
                    {text.inventoryHealth}
                  </p>
                  <p className="mt-1 font-semibold">
                    {statistics.products.lowStockProducts}{' '}
                    {text.lowStockFlagged}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/90 border-0 shadow-sm xl:col-span-8">
              <CardHeader>
                <CardTitle className="text-base">
                  {text.topProfitableProducts}
                </CardTitle>
                <CardDescription>
                  {text.revenueAndProfitPerProduct}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topProfitableProducts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {text.noProfitabilityData}
                  </p>
                ) : (
                  <ChartContainer
                    config={profitabilityConfig}
                    className="aspect-auto h-[300px] w-full"
                  >
                    <BarChart
                      data={topProfitableProducts.map((item) => ({
                        product: item.productName,
                        profit: item.grossProfit,
                        revenue: item.revenue,
                      }))}
                      margin={{ left: 8, right: 8 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="product"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) =>
                          typeof value === 'string' && value.length > 12
                            ? `${value.slice(0, 12)}...`
                            : String(value)
                        }
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          `${Math.round(Number(value) / 1000)}k`
                        }
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value) =>
                              formatMoney(Number(value), resolvedCurrency)
                            }
                          />
                        }
                      />
                      <Bar
                        dataKey="profit"
                        fill="var(--color-profit)"
                        radius={6}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="var(--color-revenue)"
                        radius={6}
                        fillOpacity={0.45}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {marginLeaders.length > 0 && (
              <Card className="bg-card/90 border-0 shadow-sm xl:col-span-4">
                <CardHeader>
                  <CardTitle className="text-base">
                    {text.marginLeaders}
                  </CardTitle>
                  <CardDescription>
                    {text.highestMarginProducts}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {marginLeaders.map((item) => (
                    <div key={item.productId} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-muted-foreground text-xs">
                            {item.soldQuantity} {text.sold}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          {item.profitMarginPercent.toFixed(1)}% {text.margin}
                        </span>
                      </div>
                      <div className="bg-muted mt-3 h-2 rounded-full">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{
                            width: `${Math.min(
                              Math.max(item.profitMarginPercent, 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {text.profit}
                        </span>
                        <span className="font-medium">
                          {formatMoney(item.grossProfit, resolvedCurrency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/90 border-0 shadow-sm xl:col-span-12">
              <CardHeader>
                <CardTitle className="text-base">AI Stock Insights</CardTitle>
                <CardDescription>
                  Local AI (no external API): stockout risk and reorder
                  recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stockInsightsLoading ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !stockInsights || stockInsights.items.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No stock insights available yet.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">
                          High risk products
                        </p>
                        <p className="text-xl font-semibold">
                          {stockInsights.summary.highRiskCount}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">
                          Medium risk products
                        </p>
                        <p className="text-xl font-semibold">
                          {stockInsights.summary.mediumRiskCount}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">
                          Low risk products
                        </p>
                        <p className="text-xl font-semibold">
                          {stockInsights.summary.lowRiskCount}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">
                          Recommended reorder units
                        </p>
                        <p className="text-xl font-semibold">
                          {stockInsights.summary.totalRecommendedUnits}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {stockInsights.items.slice(0, 6).map((item) => (
                        <div
                          key={item.productId}
                          className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-muted-foreground text-xs">
                              Stock: {item.currentQuantity} | Sold (
                              {stockInsights.lookbackDays}d):{' '}
                              {item.soldLastPeriod} | Daily rate:{' '}
                              {item.dailySalesRate}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {item.reason}
                            </p>
                            <p className="text-xs font-medium">
                              Recommendation: {item.recommendation}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                item.riskLevel === 'HIGH'
                                  ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                                  : item.riskLevel === 'MEDIUM'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {item.riskLevel}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              Reorder: {item.recommendedReorderQuantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-muted-foreground text-xs">
          {text.lastUpdated}:{' '}
          {new Date(statistics.lastUpdated).toLocaleString(lang)}
        </div>
      </>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.statistics}</h1>
        <p className="text-muted-foreground">{t.statisticsDescription}</p>
      </div>
      {content}
      <Chatbot businessId={businessId} dictionary={dictionary} />
    </div>
  );
}
