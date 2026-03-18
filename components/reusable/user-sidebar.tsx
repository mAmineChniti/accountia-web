'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { LayoutDashboard, LogOut } from 'lucide-react';
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

  const handlePostLogout = async () => {
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
        {/* Dashboard at top */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={dashboardHref}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {dashboardLabel}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{dashboardTooltip}</p>
          </TooltipContent>
        </Tooltip>

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
                  <AvatarImage src="" alt={displayName} />
                  <AvatarFallback className="text-xs font-semibold">
                    {fallbackInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-muted-foreground text-xs">
                    {user.email}
                  </span>
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
