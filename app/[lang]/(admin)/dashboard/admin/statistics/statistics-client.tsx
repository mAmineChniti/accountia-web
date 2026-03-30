'use client';

import { useState, useEffect } from 'react';
import { AdminStatsRequests } from '@/lib/requests';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { Activity, CircleDollarSign, Coins, Target, Percent, FileCheck2 } from 'lucide-react';

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

export default function StatisticsClient({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const result = await AdminStatsRequests.getStatistics();
      setData(result);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 60s auto refresh
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Statistics...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }

  if (!data) return null;

  const formatCurrency = (val: number | null | undefined) => val != null ? `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0.00';
  const formatPercent = (val: number | null | undefined) => val != null ? `${(val * 100).toFixed(1)}%` : '0.0%';
  const formatScore = (val: number | null | undefined) => val != null ? val.toFixed(2) : '0.00';

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Statistics</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights from MongoDB transactions (Auto-refresh every 60s).
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue */}
        <div className="glass-card flex flex-col gap-1 p-6 rounded-xl border shadow-sm bg-card text-card-foreground">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Coins className="h-4 w-4" />
            Total Revenue
          </div>
          <div className="text-2xl font-bold">{formatCurrency(data.kpis.totalRevenue)}</div>
        </div>
        
        {/* Expenditure */}
        <div className="glass-card flex flex-col gap-1 p-6 rounded-xl border shadow-sm bg-card text-card-foreground">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <CircleDollarSign className="h-4 w-4" />
            Total Expenditure
          </div>
          <div className="text-2xl font-bold">{formatCurrency(data.kpis.totalExpenditure)}</div>
        </div>

        {/* Net Income */}
        <div className="glass-card flex flex-col gap-1 p-6 rounded-xl border shadow-sm bg-card text-card-foreground">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Activity className="h-4 w-4" />
            Net Income
          </div>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(data.kpis.netIncome)}
          </div>
        </div>

        {/* Profit Margin */}
        <div className="glass-card flex flex-col gap-1 p-6 rounded-xl border shadow-sm bg-card text-card-foreground">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Percent className="h-4 w-4" />
            Avg Profit Margin
          </div>
          <div className="text-2xl font-bold">{formatPercent(data.kpis.avgProfitMargin)}</div>
        </div>

        {/* Success Rate */}
        <div className="glass-card flex flex-col gap-1 p-6 rounded-xl border shadow-sm bg-card text-card-foreground">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <FileCheck2 className="h-4 w-4" />
            Success Rate
          </div>
          <div className="text-2xl font-bold">{data.kpis.successRate != null ? data.kpis.successRate.toFixed(1) : '0.0'}% ({data.kpis.totalTransactions || 0} tx)</div>
        </div>

        {/* Accuracy Score */}
        <div className="glass-card flex flex-col gap-1 p-6 rounded-xl border shadow-sm bg-card text-card-foreground">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Target className="h-4 w-4" />
            Avg Accuracy Score
          </div>
          <div className="text-2xl font-bold">{formatScore(data.kpis.avgAccuracyScore)}</div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Line Chart */}
        <div className="glass-card flex flex-col p-6 rounded-xl border shadow-sm bg-card text-card-foreground col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold mb-6">Revenue vs Expenditure vs Net Income</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.charts.revenueVsExpenditure}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip formatter={(value: any) => typeof value === 'number' ? `$${value.toFixed(2)}` : '$0.00'} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Expenditure" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Net Income" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart 1 */}
        <div className="glass-card flex flex-col p-6 rounded-xl border shadow-sm bg-card text-card-foreground">
          <h3 className="text-lg font-semibold mb-6">Transactions by Account Type</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.transactionsByAccountType}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card flex flex-col p-6 rounded-xl border shadow-sm bg-card text-card-foreground">
          <h3 className="text-lg font-semibold mb-6">Profit Margin Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.profitMarginDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="var(--color-primary)"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent != null ? (percent * 100).toFixed(0) : 0}%`}
                >
                  {data.charts.profitMarginDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart 2 */}
        <div className="glass-card flex flex-col p-6 rounded-xl border shadow-sm bg-card text-card-foreground col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold mb-6">Total Amount by Account Type</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.totalAmountByAccountType}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip formatter={(value: any) => typeof value === 'number' ? `$${value.toFixed(2)}` : '$0.00'} />
                <Bar dataKey="value" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
