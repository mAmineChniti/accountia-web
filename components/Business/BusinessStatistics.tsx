'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Receipt,
  DollarSign,
  Percent,
} from 'lucide-react';
import {
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ComposedChart,
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

  const {
    data: stockInsights,
    isLoading: stockInsightsLoading,
    isError: stockInsightsError,
  } = useQuery({
    queryKey: ['product-stock-insights', businessId],
    queryFn: () => ProductsService.getStockInsights(businessId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Prepare chart data as ONE continuous dataset
  // This creates a seamless line where historical transitions to predicted
  const prepareTimeSeriesData = useCallback(
    (
      historical: { date: string; value: number }[],
      predicted: { date: string; value: number }[]
    ) => {
      if (historical.length === 0 && predicted.length === 0) return [];

      // Sort both arrays by date
      const sortedHist = [...historical].toSorted((a, b) =>
        a.date.localeCompare(b.date)
      );
      const sortedPred = [...predicted].toSorted((a, b) =>
        a.date.localeCompare(b.date)
      );

      // Build unified chronological dataset
      const unifiedData: Array<{
        date: string;
        value: number;
        type: 'historical' | 'predicted';
      }> = [];

      // Add all historical points
      for (const d of sortedHist) {
        unifiedData.push({ date: d.date, value: d.value, type: 'historical' });
      }

      // Add predicted points (may overlap with last historical date)
      for (const d of sortedPred) {
        unifiedData.push({ date: d.date, value: d.value, type: 'predicted' });
      }

      // Sort by date
      unifiedData.sort((a, b) => a.date.localeCompare(b.date));

      // Find the index where predicted data starts
      let firstPredictedIndex = unifiedData.findIndex(
        (d) => d.type === 'predicted'
      );
      if (firstPredictedIndex === -1) firstPredictedIndex = unifiedData.length;

      // Transform to chart format
      // Historical line: goes from first historical to first predicted (inclusive)
      // Predicted line: goes from first predicted onwards (inclusive)
      return unifiedData.map((d, index) => {
        // Historical line includes all points up to and including first predicted
        const isHistoricalSegment =
          d.type === 'historical' ||
          (d.type === 'predicted' && index === firstPredictedIndex);

        // Predicted line starts from first predicted and continues
        const isPredictedSegment =
          d.type === 'predicted' && index >= firstPredictedIndex;

        return {
          date: d.date,
          // Historical: all historical points + the first predicted point (connection)
          historicalValue: isHistoricalSegment ? d.value : undefined,
          // Predicted: first predicted point onwards
          predictedValue: isPredictedSegment ? d.value : undefined,
          type: d.type,
        };
      });
    },
    []
  );

  // Memoized chart data - called unconditionally at top level
  const revenueChartData = useMemo(() => {
    if (!statistics) return [];
    return prepareTimeSeriesData(
      statistics.revenueTimeSeries.revenue.historical,
      statistics.revenueTimeSeries.revenue.predicted
    );
  }, [statistics, prepareTimeSeriesData]);

  const salesVolumeData = useMemo(() => {
    if (!statistics) return [];
    return prepareTimeSeriesData(
      statistics.revenueTimeSeries.salesVolume.historical,
      statistics.revenueTimeSeries.salesVolume.predicted
    );
  }, [statistics, prepareTimeSeriesData]);

  const profitAnalysisData = useMemo(() => {
    if (!statistics) return [];
    const allDates = new Set([
      ...statistics.revenueTimeSeries.revenue.historical.map((d) => d.date),
      ...statistics.revenueTimeSeries.revenue.predicted.map((d) => d.date),
    ]);
    const sortedDates = [...allDates].toSorted();

    return sortedDates.map((date) => {
      const revPoint =
        statistics.revenueTimeSeries.revenue.historical.find(
          (d) => d.date === date
        ) ??
        statistics.revenueTimeSeries.revenue.predicted.find(
          (d) => d.date === date
        );
      const cogsPoint =
        statistics.revenueTimeSeries.cogs.historical.find(
          (d) => d.date === date
        ) ??
        statistics.revenueTimeSeries.cogs.predicted.find(
          (d) => d.date === date
        );

      return {
        date,
        revenue: revPoint?.value ?? 0,
        cogs: cogsPoint?.value ?? 0,
        grossProfit: (revPoint?.value ?? 0) - (cogsPoint?.value ?? 0),
      };
    });
  }, [statistics]);

  // Chart configurations with distinct colors for historical vs predicted
  // Historical: solid blue (#2563eb), Predicted: dashed orange (#f97316)
  const revenueChartConfig = {
    historicalValue: {
      label: text.historicalData,
      color: '#2563eb',
    },
    predictedValue: {
      label: text.predictedData,
      color: '#f97316',
    },
  } satisfies ChartConfig;

  const profitAnalysisConfig = {
    revenue: {
      label: text.revenue,
      color: '#2563eb',
    },
    cogs: {
      label: text.cogs,
      color: '#dc2626',
    },
    grossProfit: {
      label: text.grossProfit,
      color: '#16a34a',
    },
  } satisfies ChartConfig;

  const salesVolumeConfig = {
    historicalValue: {
      label: text.historicalVolume,
      color: '#7c3aed',
    },
    predictedValue: {
      label: text.predictedVolume,
      color: '#f97316',
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
    const {
      kpis,
      invoiceStatistics,
      productStatistics,
      salesAnalytics,
      revenueTimeSeries,
      period,
    } = statistics;
    const resolvedCurrency = 'TND';

    // Calculate metrics
    const totalInvoiceAmount =
      invoiceStatistics.paidAmount +
      invoiceStatistics.pendingAmount +
      invoiceStatistics.overdueAmount;
    const collectionRate =
      totalInvoiceAmount > 0
        ? (invoiceStatistics.paidAmount / totalInvoiceAmount) * 100
        : 0;

    // Check if there are any predicted values to show
    const hasPredictedRevenue = revenueTimeSeries.revenue.predicted.length > 0;
    const hasPredictedVolume =
      revenueTimeSeries.salesVolume.predicted.length > 0;

    const hasNoData =
      productStatistics.totalProducts === 0 &&
      invoiceStatistics.totalInvoices === 0;

    content = (
      <>
        {hasNoData && (
          <Alert>
            <AlertDescription>{text.noData}</AlertDescription>
          </Alert>
        )}

        {/* KPI SECTION - Top Priority */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-0 bg-linear-to-br from-blue-500/10 to-blue-600/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-muted-foreground text-xs">
                  {text.totalRevenue}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {formatMoney(kpis.totalRevenue, resolvedCurrency)}
              </p>
              <p className="text-muted-foreground text-xs">
                {text.period}: {period.start} - {period.end}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-linear-to-br from-red-500/10 to-red-600/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-red-600" />
                <span className="text-muted-foreground text-xs">
                  {text.totalCOGS}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {formatMoney(kpis.totalCOGS, resolvedCurrency)}
              </p>
              <p className="text-muted-foreground text-xs">
                {text.costOfGoodsSold}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-linear-to-br from-emerald-500/10 to-emerald-600/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-muted-foreground text-xs">
                  {text.grossProfit}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {formatMoney(kpis.grossProfit, resolvedCurrency)}
              </p>
              <p className="text-muted-foreground text-xs">
                {text.revenueMinusCOGS}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-linear-to-br from-purple-500/10 to-purple-600/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span className="text-muted-foreground text-xs">
                  {text.netProfit}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {formatMoney(kpis.netProfit, resolvedCurrency)}
              </p>
              <p className="text-muted-foreground text-xs">
                {text.afterAllExpenses}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-linear-to-br from-amber-500/10 to-amber-600/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-amber-600" />
                <span className="text-muted-foreground text-xs">
                  {text.profitMargin}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {kpis.profitMarginPercent.toFixed(1)}%
              </p>
              <p className="text-muted-foreground text-xs">
                {text.grossProfitMargin}
              </p>
            </CardContent>
          </Card>
        </div>

        {!hasNoData && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* MAIN FINANCIAL CHART - Revenue with Forecast */}
            <Card className="border-0 shadow-sm lg:col-span-8">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {text.revenueForecast}
                    </CardTitle>
                    <CardDescription>
                      {text.historicalVsAIPredicted}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {period.start} → {period.end}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={revenueChartConfig}
                  className="aspect-auto h-[320px] w-full"
                >
                  <ComposedChart
                    data={revenueChartData}
                    margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient
                        id="historicalGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="predictedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f97316"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f97316"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        const [year, month] = String(value).split('-');
                        return `${month}/${year.slice(2)}`;
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `${Math.round(Number(value) / 1000)}k`
                      }
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => {
                            return [
                              formatMoney(Number(value), resolvedCurrency),
                              name === 'predictedValue'
                                ? text.predictedData
                                : text.historicalData,
                            ];
                          }}
                        />
                      }
                    />
                    {/* Historical line - solid, stops where prediction starts */}
                    <Line
                      type="linear"
                      dataKey="historicalValue"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#2563eb' }}
                      connectNulls={true}
                      isAnimationActive={false}
                      name="historical"
                    />
                    {/* Predicted line - dashed, starts where historical ends */}
                    {hasPredictedRevenue && (
                      <Line
                        type="linear"
                        dataKey="predictedValue"
                        stroke="#f97316"
                        strokeWidth={3}
                        strokeDasharray="6 3"
                        dot={false}
                        activeDot={{ r: 6, fill: '#f97316' }}
                        connectNulls={true}
                        isAnimationActive={false}
                        name="predicted"
                      />
                    )}
                    <ChartLegend content={<ChartLegendContent />} />
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* SALES TREND INDICATOR */}
            <Card className="border-0 shadow-sm lg:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {text.businessTrend}
                </CardTitle>
                <CardDescription>
                  {text.overallPerformanceDirection}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6">
                  <div
                    className={`rounded-full p-6 ${
                      salesAnalytics.salesTrend === 'growth'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : salesAnalytics.salesTrend === 'decline'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}
                  >
                    {salesAnalytics.salesTrend === 'growth' ? (
                      <TrendingUp className="h-12 w-12 text-emerald-600" />
                    ) : salesAnalytics.salesTrend === 'decline' ? (
                      <TrendingDown className="h-12 w-12 text-red-600" />
                    ) : (
                      <Minus className="h-12 w-12 text-amber-600" />
                    )}
                  </div>
                  <p
                    className={`mt-4 text-2xl font-bold ${
                      salesAnalytics.salesTrend === 'growth'
                        ? 'text-emerald-600'
                        : salesAnalytics.salesTrend === 'decline'
                          ? 'text-red-600'
                          : 'text-amber-600'
                    }`}
                  >
                    {salesAnalytics.salesTrend === 'growth'
                      ? text.growth
                      : salesAnalytics.salesTrend === 'decline'
                        ? text.decline
                        : text.stagnation}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {text.basedOnSalesVolume}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* COST VS PROFIT ANALYSIS */}
            <Card className="border-0 shadow-sm lg:col-span-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {text.profitabilityAnalysis}
                </CardTitle>
                <CardDescription>{text.revenueCOGSAndProfit}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={profitAnalysisConfig}
                  className="aspect-auto h-[280px] w-full"
                >
                  <ComposedChart
                    data={profitAnalysisData}
                    margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="hsl(var(--muted))"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const [year, month] = String(value).split('-');
                        return `${month}/${year.slice(2)}`;
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `${Math.round(Number(value) / 1000)}k`
                      }
                    />
                    <ChartTooltip
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
                      dataKey="revenue"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="cogs"
                      stroke="#dc2626"
                      fill="#dc2626"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="grossProfit"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* SALES VOLUME CHART */}
            <Card className="border-0 shadow-sm lg:col-span-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {text.salesVolumeForecast}
                </CardTitle>
                <CardDescription>
                  {text.unitsSoldHistoricalVsPredicted}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={salesVolumeConfig}
                  className="aspect-auto h-[280px] w-full"
                >
                  <ComposedChart
                    data={salesVolumeData}
                    margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient
                        id="volumeHistorical"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#7c3aed"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#7c3aed"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="volumePredicted"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f97316"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f97316"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const [year, month] = String(value).split('-');
                        return `${month}/${year.slice(2)}`;
                      }}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => {
                            return [
                              `${value} ${text.units}`,
                              name === 'predictedValue'
                                ? text.predictedData
                                : text.historicalData,
                            ];
                          }}
                        />
                      }
                    />
                    {/* Historical line - solid, stops where prediction starts */}
                    <Line
                      type="linear"
                      dataKey="historicalValue"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#7c3aed' }}
                      connectNulls={true}
                      isAnimationActive={false}
                      name="historical"
                    />
                    {/* Predicted line - dashed, starts where historical ends */}
                    {hasPredictedVolume && (
                      <Line
                        type="linear"
                        dataKey="predictedValue"
                        stroke="#f97316"
                        strokeWidth={3}
                        strokeDasharray="6 3"
                        dot={false}
                        activeDot={{ r: 6, fill: '#f97316' }}
                        connectNulls={true}
                        isAnimationActive={false}
                        name="predicted"
                      />
                    )}
                    <ChartLegend content={<ChartLegendContent />} />
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* INVOICE STATISTICS */}
            <Card className="border-0 shadow-sm lg:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4" />
                  {text.invoiceStatus}
                </CardTitle>
                <CardDescription>
                  {text.paymentCollectionOverview}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {text.collectionRate}
                    </span>
                    <span className="font-semibold">
                      {collectionRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={collectionRate} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                    <p className="text-xs font-medium text-emerald-600">
                      {text.paid}
                    </p>
                    <p className="text-lg font-bold">
                      {invoiceStatistics.paidInvoices}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatMoney(
                        invoiceStatistics.paidAmount,
                        resolvedCurrency
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                    <p className="text-xs font-medium text-amber-600">
                      {text.pending}
                    </p>
                    <p className="text-lg font-bold">
                      {invoiceStatistics.pendingInvoices}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatMoney(
                        invoiceStatistics.pendingAmount,
                        resolvedCurrency
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                    <p className="text-xs font-medium text-red-600">
                      {text.overdue}
                    </p>
                    <p className="text-lg font-bold">
                      {invoiceStatistics.overdueInvoices}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatMoney(
                        invoiceStatistics.overdueAmount,
                        resolvedCurrency
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-xs font-medium text-blue-600">
                      {text.totalInvoices}
                    </p>
                    <p className="text-lg font-bold">
                      {invoiceStatistics.totalInvoices}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatMoney(totalInvoiceAmount, resolvedCurrency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PRODUCT INVENTORY */}
            <Card className="border-0 shadow-sm lg:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  {text.inventoryStatus}
                </CardTitle>
                <CardDescription>
                  {text.productAndStockOverview}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-xs font-medium text-blue-600">
                      {text.totalProducts}
                    </p>
                    <p className="text-2xl font-bold">
                      {productStatistics.totalProducts}
                    </p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                    <p className="text-xs font-medium text-purple-600">
                      {text.inventoryValue}
                    </p>
                    <p className="text-lg font-bold">
                      {formatMoney(
                        productStatistics.totalInventoryValue,
                        resolvedCurrency
                      )}
                    </p>
                  </div>
                </div>

                {productStatistics.lowStockProducts > 0 ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-900/20">
                    <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {productStatistics.lowStockProducts} {text.lowStockAlert}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:bg-emerald-900/20">
                    <p className="text-sm font-medium text-emerald-600">
                      {text.allProductsInStock}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TOP PRODUCTS */}
            <Card className="border-0 shadow-sm lg:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{text.topProducts}</CardTitle>
                <CardDescription>
                  {text.bestPerformingByRevenue}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {salesAnalytics.topProducts
                    .slice(0, 4)
                    .map((product, index) => (
                      <div
                        key={product.productId}
                        className="bg-muted/50 flex items-center justify-between rounded-lg p-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {product.productName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {product.soldQuantity} {text.sold}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatMoney(product.revenue, resolvedCurrency)}
                          </p>
                          <p className="text-xs text-emerald-600">
                            {product.profitMarginPercent.toFixed(0)}%{' '}
                            {text.margin}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* UNDERPERFORMING PRODUCTS */}
            {salesAnalytics.underperformingProducts &&
              salesAnalytics.underperformingProducts.length > 0 && (
                <Card className="border-0 shadow-sm lg:col-span-12">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-red-600">
                      {text.underperformingProducts}
                    </CardTitle>
                    <CardDescription>
                      {text.lowestProfitMarginsReview}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {salesAnalytics.underperformingProducts
                        .slice(0, 6)
                        .map((product) => (
                          <div
                            key={product.productId}
                            className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:bg-red-900/10"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">
                                  {product.productName}
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                  {product.soldQuantity} {text.sold} ·{' '}
                                  {text.revenue}:{' '}
                                  {formatMoney(
                                    product.revenue,
                                    resolvedCurrency
                                  )}
                                </p>
                              </div>
                              <Badge variant="destructive" className="text-xs">
                                {product.profitMarginPercent.toFixed(1)}%{' '}
                                {text.margin}
                              </Badge>
                            </div>
                            <div className="mt-3">
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {text.margin}
                                </span>
                                <span className="font-medium text-red-600">
                                  {text.lowProfitability}
                                </span>
                              </div>
                              <Progress
                                value={Math.max(0, product.profitMarginPercent)}
                                className="h-1.5 bg-red-200"
                              />
                            </div>
                            <div className="mt-3 flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {text.cost}:{' '}
                                {formatMoney(
                                  product.unitCost,
                                  resolvedCurrency
                                )}
                              </span>
                              <span className="text-muted-foreground">
                                {text.price}:{' '}
                                {formatMoney(
                                  product.unitPrice,
                                  resolvedCurrency
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* MARGIN LEADERS */}
            {salesAnalytics.topProducts.some((p) => p.soldQuantity > 0) && (
              <Card className="border-0 shadow-sm lg:col-span-12">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-emerald-600">
                    {text.marginLeaders}
                  </CardTitle>
                  <CardDescription>
                    {text.highestProfitMarginProducts}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {salesAnalytics.topProducts
                      .filter((p) => p.soldQuantity > 0)
                      .toSorted(
                        (a, b) => b.profitMarginPercent - a.profitMarginPercent
                      )
                      .slice(0, 4)
                      .map((product) => (
                        <div
                          key={product.productId}
                          className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:bg-emerald-900/10"
                        >
                          <div className="flex items-start justify-between">
                            <p className="font-medium">{product.productName}</p>
                            <Badge className="bg-emerald-600 text-xs">
                              {product.profitMarginPercent.toFixed(1)}%
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {product.soldQuantity} {text.unitsSold}
                          </p>
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {text.revenue}
                              </span>
                              <span className="font-medium">
                                {formatMoney(product.revenue, resolvedCurrency)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {text.profit}
                              </span>
                              <span className="font-medium text-emerald-600">
                                {formatMoney(
                                  product.grossProfit,
                                  resolvedCurrency
                                )}
                              </span>
                            </div>
                          </div>
                          <Progress
                            value={Math.min(100, product.profitMarginPercent)}
                            className="mt-3 h-1.5 bg-emerald-200"
                          />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/90 border-0 shadow-sm xl:col-span-12">
              <CardHeader>
                <CardTitle className="text-base">
                  {text.stockInsightsTitle || 'AI Stock Insights'}
                </CardTitle>
                <CardDescription>
                  {text.stockInsightsDescription ||
                    'Local AI (no external API): stockout risk and reorder recommendations'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stockInsightsLoading ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : stockInsightsError ? (
                  <p className="text-destructive text-sm">
                    {text.stockInsightsError ||
                      'Failed to load stock insights.'}
                  </p>
                ) : !stockInsights || stockInsights.items.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {text.noStockInsights || 'No stock insights available yet.'}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">
                          {text.highRiskProducts || 'High risk products'}
                        </p>
                        <p className="text-xl font-semibold">
                          {stockInsights.summary.highRiskCount}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">
                          {text.mediumRiskProducts || 'Medium risk products'}
                        </p>
                        <p className="text-xl font-semibold">
                          {stockInsights.summary.mediumRiskCount}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">
                          {text.lowRiskProducts || 'Low risk products'}
                        </p>
                        <p className="text-xl font-semibold">
                          {stockInsights.summary.lowRiskCount}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">
                          {text.recommendedReorderUnits ||
                            'Recommended reorder units'}
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
                              {text.stockLabel || 'Stock'}:{' '}
                              {item.currentQuantity} |{' '}
                              {(
                                text.soldLastPeriod || 'Sold ({days}d)'
                              ).replace(
                                '{days}',
                                stockInsights.lookbackDays.toString()
                              )}
                              : {item.soldLastPeriod} |{' '}
                              {text.dailyRate || 'Daily rate'}:{' '}
                              {item.dailySalesRate}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {item.reason}
                            </p>
                            <p className="text-xs font-medium">
                              {text.recommendationLabel || 'Recommendation'}:{' '}
                              {item.recommendation}
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
                              {text.reorderLabel || 'Reorder'}:{' '}
                              {item.recommendedReorderQuantity}
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
