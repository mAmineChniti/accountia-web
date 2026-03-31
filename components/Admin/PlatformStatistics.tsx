'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users as UsersIcon, UserPlus, Clock, RotateCw } from 'lucide-react';
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
} from 'recharts';
import { cn } from '@/lib/utils';
import { AuthService, AdminStatsRequests, PlatformStatisticsResponse } from '@/lib/requests';
import type { Dictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import type { UsersListResponse } from '@/types/ResponseInterfaces';

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

const GrowthIndicator = ({ value }: { value: number }) => {
  if (value === 0) return;
  const isPositive = value > 0;
  return (
    <span
      className={`text-xs font-medium ltr:ml-2 rtl:mr-2 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
    >
      {isPositive ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
};

export default function PlatformStatistics({
  dictionary,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const [platformStats, setPlatformStats] =
    useState<PlatformStatisticsResponse | undefined>(undefined);
  const [statsRange, setStatsRange] = useState('30d');
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [statsCountdown, setStatsCountdown] = useState(60);

  const { data, isLoading, refetch, isFetching } = useQuery<UsersListResponse>({
    queryKey: ['users'],
    queryFn: AuthService.fetchAllUsers,
  });

  const fetchPlatformStats = async (currentRange: string) => {
    try {
      const result =
        await AdminStatsRequests.getPlatformStatistics(currentRange);
      setPlatformStats(result);
      setStatsError('');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch platform statistics';
      setStatsError(errorMessage);
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformStats(statsRange);
    setStatsCountdown(60);
    const interval = setInterval(() => {
      fetchPlatformStats(statsRange);
      setStatsCountdown(60);
    }, 60_000);
    const countdownInterval = setInterval(() => {
      setStatsCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [statsRange]);

  const roleCounts = (() => {
    const counts = {
      PLATFORM_OWNER: 0,
      PLATFORM_ADMIN: 0,
      BUSINESS_OWNER: 0,
      BUSINESS_ADMIN: 0,
      CLIENT: 0,
    };
    if (data?.users) {
      for (const u of data.users) {
        const role = u.role as keyof typeof counts;
        if (role && role in counts) {
          counts[role]++;
        }
      }
    }
    return counts;
  })();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-bold tracking-tight">
          Platform Statistics
        </div>
        <div className="text-muted-foreground">
          Platform-wide user trends and distribution
        </div>
      </div>

      <div className="flex w-fit items-center gap-2">
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
            <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
          </span>
          {statsCountdown}s
        </span>
        <div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(statsCountdown / 60) * 100}%` }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            refetch();
            fetchPlatformStats(statsRange);
          }}
          disabled={isFetching || isStatsLoading}
          className={cn(
            'ml-2 h-8 w-8 shrink-0',
            (isFetching || isStatsLoading) && 'animate-spin'
          )}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      {isStatsLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : platformStats ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="p-6">
              <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <UsersIcon className="h-4 w-4" />
                {dictionary.admin.stats.totalUsers || 'Total Users'}
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">
                  {platformStats.kpis.totalUsers}
                </div>
                <GrowthIndicator value={platformStats.growth.totalUsers} />
              </div>
            </CardHeader>
          </Card>

          <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="p-6">
              <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <UserPlus className="h-4 w-4" />
                New Registrations
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-primary text-3xl font-bold">
                  +{platformStats.kpis.newRegistrations}
                </div>
                <GrowthIndicator
                  value={platformStats.growth.newRegistrations}
                />
              </div>
            </CardHeader>
          </Card>

          <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="p-6">
              <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Pending Applications
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {platformStats.kpis.pendingApplications}
                </div>
                <GrowthIndicator
                  value={platformStats.growth.pendingApplications}
                />
              </div>
            </CardHeader>
          </Card>
        </div>
      ) : statsError ? (
        <div className="text-destructive bg-destructive/10 rounded-lg p-4 text-sm">
          {statsError}
        </div>
      ) : undefined}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Platform Admin</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading
                ? '...'
                : roleCounts.PLATFORM_ADMIN + roleCounts.PLATFORM_OWNER}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Business Owner</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? '...' : roleCounts.BUSINESS_OWNER}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Business Admin</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? '...' : roleCounts.BUSINESS_ADMIN}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Client</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? '...' : roleCounts.CLIENT}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      </div>

      {!isStatsLoading && platformStats && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <CardTitle className="text-lg font-semibold">
                User Registration Trends
              </CardTitle>
              <div className="bg-muted/50 flex items-center rounded-lg border p-1">
                <button
                  onClick={() => setStatsRange('7d')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    statsRange === '7d'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setStatsRange('30d')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    statsRange === '30d'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={platformStats.charts.registrationTrends}>
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
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      name="New Users"
                      stroke="var(--color-primary)"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: 'var(--color-primary)',
                        strokeWidth: 0,
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Users Distribution by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformStats.charts.usersByRole.map(
                        (entry, index) => ({
                          ...entry,
                          fill: CHART_COLORS[index % CHART_COLORS.length],
                        })
                      )}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    />
                    <RechartsTooltip
                      formatter={(value: string | number, name: string) => [
                        value,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {(() => {
                  const total = platformStats.charts.usersByRole.reduce(
                    (sum: number, d) => sum + d.value,
                    0
                  );
                  return platformStats.charts.usersByRole.map(
                    (entry, index) => (
                      <div
                        key={entry.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="text-foreground font-medium">
                            {entry.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {entry.value} users
                          </span>
                          <span className="text-foreground w-10 text-right text-xs font-semibold tabular-nums">
                            {total > 0
                              ? ((entry.value / total) * 100).toFixed(0)
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                    )
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
