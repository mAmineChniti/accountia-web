/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  BarChart3,
  FileBarChart,
  Briefcase,
  LayoutTemplate,
  Repeat,
  Users,
  LineChart,
} from 'lucide-react';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { type UserCookieData } from '@/types/auth';
import { logout } from '@/actions/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import LocaleSwitcher from '@/components/reusable/locale-switcher';
import { ModeToggle } from '@/components/reusable/theme-toggle';

export default function UserSidebar({
  lang,
  dictionary,
  user,
}: {
  lang: Locale;
  dictionary: Dictionary;
  user: UserCookieData;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profilePicture] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem('profilePicture') ?? undefined;
    } catch {
      return;
    }
  });

  const handlePostLogout = async () => {
    try {
      localStorage.removeItem('profilePicture');
    } catch {}
    globalThis.dispatchEvent(new Event('auth:changed'));
    router.refresh();
    router.push(`/${lang}/login`);
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: async () => {
      await handlePostLogout();
    },
    onError: async () => {
      await handlePostLogout();
    },
  });

  const isAdmin = ['PLATFORM_ADMIN', 'PLATFORM_OWNER'].includes(
    user.role ?? ''
  );

  const isClient = user.role === 'CLIENT';

  const dashboardHref = isAdmin
    ? `/${lang}/dashboard/admin`
    : `/${lang}/invoices`;

  const dashboardLabel = isAdmin
    ? dictionary.pages.home.navigation.adminDashboard
    : dictionary.pages.home.navigation.invoices;

  const dashboardTooltip = isAdmin
    ? dictionary.tooltips.adminDashboard
    : dictionary.tooltips.invoices;

  const displayName = user.firstName ?? user.username;
  const fallbackInitial = (user.firstName ?? user.username ?? 'U')
    .charAt(0)
    .toUpperCase();

  return (
    <aside className="bg-background fixed inset-y-0 z-50 flex w-64 flex-col ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l">
      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {/* Navigation Section */}
        {isAdmin ? (
          <>
            {/* Admin: Dashboard */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/${lang}/dashboard/admin`}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname.includes('/dashboard/admin') &&
                    !pathname.includes('/statistics')
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  {dictionary.pages.home.navigation.adminDashboard}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{dictionary.tooltips.adminDashboard}</p>
              </TooltipContent>
            </Tooltip>

            {/* Admin: Business Management */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/${lang}/dashboard/businesses`}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname.includes('/dashboard/businesses')
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Building2 className="h-4 w-4 shrink-0" />
                  {dictionary.admin.businessManagement.navLabel}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{dictionary.tooltips.businessManagement}</p>
              </TooltipContent>
            </Tooltip>

            {/* Admin: Platform Statistics */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/${lang}/dashboard/statistics`}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname.includes('/dashboard/statistics')
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 shrink-0" />
                  {dictionary.pages.home.navigation.platformStatistics}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{dictionary.tooltips.platformStatistics}</p>
              </TooltipContent>
            </Tooltip>
          </>
        ) : isClient ? (
          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/${lang}/managed/financials`}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname.includes('/managed/financials')
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <LineChart className="h-4 w-4 shrink-0" />
                  Financial Dashboard
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Your financials view</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {/* Non-Admin: Principal "Invoices" */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/${lang}/invoices`}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === `/${lang}/invoices`
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <FileBarChart className="h-4 w-4 shrink-0" />
                  {dictionary.pages.home.navigation.invoices}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{dictionary.tooltips.invoices}</p>
              </TooltipContent>
            </Tooltip>

            {/* Sub-item: Reports */}
            <Link
              href={`/${lang}/invoices/reports`}
              className={`hover:text-accent-foreground ml-9 flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === `/${lang}/invoices/reports`
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              {dictionary.pages.reports.navReports}
            </Link>

            {/* Non-Admin: Templates */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/${lang}/invoices/templates`}
                  className={`mt-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname.includes('/invoices/templates')
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <LayoutTemplate className="h-4 w-4 shrink-0" />
                  Templates
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Invoice Templates</p>
              </TooltipContent>
            </Tooltip>

            {/* Non-Admin: Recurring Invoices */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/${lang}/invoices/recurring`}
                  className={`mt-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname.includes('/invoices/recurring')
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Repeat className="h-4 w-4 shrink-0" />
                  Recurring Invoices
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Automate Invoices</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Spacer pushes profile/logout to bottom */}
        <div className="flex-1" />

        <Separator className="my-2" />

        {/* Profile link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/${lang}/profile`}
              className="hover:bg-accent hover:text-accent-foreground flex flex-col gap-1.5 rounded-md px-3 py-3 text-sm font-medium transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={profilePicture} alt={displayName} />
                  <AvatarFallback className="text-xs font-semibold">
                    {fallbackInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{displayName}</span>
                </div>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{dictionary.tooltips.profile}</p>
          </TooltipContent>
        </Tooltip>

        {/* Logout */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent! dark:hover:text-accent-foreground h-auto w-full justify-start gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {dictionary.pages.home.navigation.logout}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{dictionary.tooltips.logout}</p>
          </TooltipContent>
        </Tooltip>
      </nav>

      {/* Utilities (locale + theme) */}
      <div className="flex items-center justify-between border-t px-4 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <LocaleSwitcher />
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{dictionary.tooltips.changeLanguage}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ModeToggle />
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{dictionary.tooltips.toggleTheme}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
