'use client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AuthService } from '@/lib/requests';

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import type { Dictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';

// Helper functions for localization
const formatCurrency = (value: number, lang: Locale): string => {
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export default function MonthlyStatsChart({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const {
    data: revData,
    isLoading: revLoading,
    error: revError,
  } = useQuery({
    queryKey: ['revenueStats'],
    queryFn: AuthService.fetchRevenuesStats,
  });

  const {
    data: expData,
    isLoading: expLoading,
    error: expError,
  } = useQuery({
    queryKey: ['expenseStats'],
    queryFn: AuthService.fetchExpensesStats,
  });

  if (revLoading || expLoading)
    return (
      <div className="text-muted-foreground animate-pulse p-4 text-center">
        {dictionary.admin?.loadingStatistics || 'Loading statistics...'}
      </div>
    );
  if (revError || expError)
    return (
      <div className="text-destructive p-4 text-center">
        {dictionary.admin?.errorLoadingStatistics || 'Error loading statistics'}
      </div>
    );

  const revAmount = revData?.totalAmount || 0;
  const expAmount = expData?.totalAmount || 0;
  const profitAmount = revAmount - expAmount;
  const isProfit = profitAmount >= 0;

  const chartData = [
    {
      name: dictionary.admin?.statisticsTitle || 'Overview',
      [dictionary.admin?.monthlyRevenue || 'Revenues']: revAmount,
      [dictionary.admin?.monthlyExpenses || 'Expenses']: expAmount,
    },
  ];

  return (
    <div className="md:col-span-3">
      <Card className="mt-6 overflow-hidden rounded-2xl border-zinc-200 bg-white/60 shadow-sm backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/40">
        <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white pb-6 dark:border-zinc-800/50 dark:from-zinc-900/50 dark:to-zinc-950/20">
          <CardTitle className="text-xl">
            {dictionary.admin.statisticsTitle}
          </CardTitle>
          <CardDescription className="text-sm">
            {dictionary.admin.statisticsSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex w-full flex-col space-y-8">
            {/* Cards Grid */}
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
              {/* Revenues Card */}
              <div className="relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-green-100/50 p-6 shadow-sm transition-all hover:shadow-md dark:border-green-900/50 dark:from-green-950/20 dark:to-green-900/10">
                <div className="absolute top-4 right-4 rounded-full bg-green-100 p-2.5 dark:bg-green-900/50">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500" />
                </div>
                <p className="mb-2 text-sm font-medium text-green-700/80 dark:text-green-400">
                  {dictionary.admin?.monthlyRevenue || 'Total Revenues'}
                </p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(revAmount, lang)}
                </p>
              </div>

              {/* Profit/Loss Card */}
              <div
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${isProfit ? 'border-emerald-200 from-emerald-50 to-teal-50 dark:border-emerald-800/50 dark:from-emerald-950/30 dark:to-teal-950/10' : 'border-rose-200 from-rose-50 to-pink-50 dark:border-rose-800/50 dark:from-rose-950/30 dark:to-pink-950/10'} border p-6 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md dark:ring-white/5`}
              >
                <div
                  className={`absolute top-4 right-4 rounded-full ${isProfit ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-rose-100 dark:bg-rose-900/50'} p-2.5`}
                >
                  {isProfit ? (
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-500" />
                  )}
                </div>
                <p
                  className={`mb-2 text-sm font-medium ${isProfit ? 'text-emerald-700/80 dark:text-emerald-400' : 'text-rose-700/80 dark:text-rose-400'}`}
                >
                  {isProfit
                    ? dictionary.admin?.netProfit || 'Net Profit'
                    : dictionary.admin?.netLoss || 'Net Loss'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-4xl font-extrabold tracking-tight ${isProfit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}
                  >
                    {isProfit ? '+' : '-'}
                    {formatCurrency(Math.abs(profitAmount), lang)}
                  </span>
                </div>
              </div>

              {/* Expenses Card */}
              <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-red-100/50 p-6 shadow-sm transition-all hover:shadow-md dark:border-red-900/50 dark:from-red-950/20 dark:to-red-900/10">
                <div className="absolute top-4 right-4 rounded-full bg-red-100 p-2.5 dark:bg-red-900/50">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-500" />
                </div>
                <p className="mb-2 text-sm font-medium text-red-700/80 dark:text-red-400">
                  {dictionary.admin?.monthlyExpenses || 'Total Expenses'}
                </p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(expAmount, lang)}
                </p>
              </div>
            </div>

            {/* Bar Chart Container */}
            <div className="mt-8 h-[300px] w-full rounded-2xl border border-zinc-100 bg-white/40 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value === undefined ? '' : formatCurrency(value, lang)
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey={dictionary.admin?.monthlyRevenue || 'Revenues'}
                    fill="#22c55e"
                  />
                  <Bar
                    dataKey={dictionary.admin?.monthlyExpenses || 'Expenses'}
                    fill="#ef4444"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
