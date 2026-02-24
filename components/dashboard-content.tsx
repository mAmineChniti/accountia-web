'use client';

import { type Locale } from '@/i18n-config';
import { useCurrentUserProfile } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function DashboardContent({ lang }: { lang: Locale }) {
  const { data: profileData, isLoading, error } = useCurrentUserProfile();
  const user = profileData?.user;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="mb-4 h-10 w-64 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-96 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">
            Error Loading Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load your profile. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section>
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {user?.firstName || user?.username}! 👋
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here&apos;s what&apos;s happening in your account today.
        </p>
      </section>

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Your account is in good standing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm break-all">{user?.email}</div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {user?.emailConfirmed ? '✓ Verified' : '⚠ Not verified'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm">
              {new Date(user?.dateJoined || '').toLocaleDateString()}
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Account created date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/${lang}/profile`}>
              <Button variant="outline" size="sm" className="w-full">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Area */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>
              Manage your account and view your information
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">User Information</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">
                      First Name
                    </dt>
                    <dd className="font-medium">
                      {user?.firstName || 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">
                      Last Name
                    </dt>
                    <dd className="font-medium">
                      {user?.lastName || 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">
                      Username
                    </dt>
                    <dd className="font-medium">{user?.username}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">
                      User ID
                    </dt>
                    <dd className="font-mono text-xs break-all">{user?.id}</dd>
                  </div>
                </dl>
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-2 font-semibold">Account Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/${lang}/profile`}>
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                  <Link href={`/${lang}`}>
                    <Button variant="outline">Go to Home</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
