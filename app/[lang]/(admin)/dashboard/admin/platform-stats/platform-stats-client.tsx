/* eslint-disable unicorn/no-null, unicorn/catch-error-name, unicorn/numeric-separators-style, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-misused-promises, @typescript-eslint/no-deprecated */
'use client';

import { useState, useEffect } from 'react';
import { AdminStatsRequests } from '@/lib/requests';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { Users, UserPlus, Building, Clock } from 'lucide-react';

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

export default function PlatformStatsClient({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async (currentRange: string) => {
    try {
      const result =
        await AdminStatsRequests.getPlatformStatistics(currentRange);
      setData(result);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to fetch platform statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(range);
    const interval = setInterval(() => fetchData(range), 60000); // 60s auto refresh
    return () => clearInterval(interval);
  }, [range]);

  const GrowthIndicator = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <span
        className={`ml-2 text-xs font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
      >
        {isPositive ? '↑' : '↓'} {Math.abs(value)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="text-muted-foreground animate-pulse p-8 text-center">
        Loading Platform Statistics...
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-8 text-center">{error}</div>;
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Platform Statistics
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights on Users and Applications (Auto-refresh every
            60s).
          </p>
        </div>

        {/* Range Switcher */}
        <div className="bg-muted/50 flex items-center rounded-lg border p-1">
          <button
            onClick={() => setRange('7d')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              range === '7d'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setRange('30d')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              range === '30d'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="glass-card bg-card text-card-foreground flex flex-col gap-1 rounded-xl border p-6 shadow-sm">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Total Users
          </div>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">{data.kpis.totalUsers}</div>
            <GrowthIndicator value={data.growth.totalUsers} />
          </div>
        </div>

        {/* New Registrations */}
        <div className="glass-card bg-card text-card-foreground flex flex-col gap-1 rounded-xl border p-6 shadow-sm">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <UserPlus className="h-4 w-4" />
            New Registrations (Days)
          </div>
          <div className="flex items-baseline">
            <div className="text-primary text-2xl font-bold">
              +{data.kpis.newRegistrations}
            </div>
            <GrowthIndicator value={data.growth.newRegistrations} />
          </div>
        </div>

        {/* Business Owners */}
        <div className="glass-card bg-card text-card-foreground flex flex-col gap-1 rounded-xl border p-6 shadow-sm">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Building className="h-4 w-4" />
            Business Owners
          </div>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">{data.kpis.businessOwners}</div>
            <GrowthIndicator value={data.growth.businessOwners} />
          </div>
        </div>

        {/* Pending Applications */}
        <div className="glass-card bg-card text-card-foreground flex flex-col gap-1 rounded-xl border p-6 shadow-sm">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            Pending Applications
          </div>
          <div className="flex items-baseline">
            <div className="text-accent-foreground text-2xl font-bold">
              {data.kpis.pendingApplications}
            </div>
            <GrowthIndicator value={data.growth.pendingApplications} />
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Line Chart: User Registration Trends */}
        <div className="glass-card bg-card text-card-foreground flex flex-col rounded-xl border p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold">
            User Registration Trends
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.charts.registrationTrends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.3}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="New Users"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Users by Role */}
        <div className="glass-card bg-card text-card-foreground flex flex-col rounded-xl border p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold">
            Users Distribution by Role
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.usersByRole}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="var(--color-primary)"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${(percent != null ? percent * 100 : 0).toFixed(0)}%)`
                  }
                >
                  {data.charts.usersByRole.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
