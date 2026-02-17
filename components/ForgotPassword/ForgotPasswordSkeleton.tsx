import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ForgotPasswordSkeleton() {
  return (
    <main className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center py-8">
      <Card className="mx-4 w-full max-w-lg" tabIndex={-1}>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold" tabIndex={-1}>
            <Skeleton className="mx-auto h-8 w-40" />
          </CardTitle>
          <CardDescription className="text-base" tabIndex={-1}>
            <Skeleton className="mx-auto h-6 w-80" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>

            <Skeleton className="h-10 w-full" />

            <div className="text-center">
              <Skeleton className="mx-auto h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
