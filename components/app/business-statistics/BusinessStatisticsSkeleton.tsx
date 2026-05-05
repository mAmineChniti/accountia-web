/* eslint-disable */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function BusinessStatisticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="mt-2 h-8 w-24" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="border-0 shadow-sm lg:col-span-8">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-3 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-auto h-[320px] w-full" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm lg:col-span-4">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-1 h-3 w-40" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="mt-4 h-8 w-24" />
              <Skeleton className="mt-1 h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="border-0 shadow-sm lg:col-span-6">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-1 h-3 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-auto h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm lg:col-span-6">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-3 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-auto h-[280px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
