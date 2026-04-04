'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { type UserCookieData } from '@/types/auth';
import { logout } from '@/actions/auth';
import { BusinessService } from '@/lib/requests';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LocaleSwitcher from '@/components/reusable/locale-switcher';
import { ModeToggle } from '@/components/reusable/theme-toggle';
import { Notifications } from '@/components/reusable/notifications';

// Navigation configuration for platform users (Admin/Owner)
interface PlatformNavItem {
  id: string;
  href: string;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
}

const getPlatformNavigation = (
  lang: Locale,
  dictionary: Dictionary
): PlatformNavItem[] => [
  {
    id: 'dashboard',
    href: `/${lang}/dashboard/admin`,
    label: dictionary.pages.home.navigation.adminDashboard,
    tooltip: dictionary.tooltips.adminDashboard,
    icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'businesses',
    href: `/${lang}/dashboard/businesses`,
    label: dictionary.admin.businessManagement.navLabel,
    tooltip: dictionary.tooltips.businessManagement,
    icon: <Building2 className="h-4 w-4 shrink-0" />,
  },
];

// Navigation configuration for client users
interface ClientNavItem {
  id: string;
  href: string;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
}

const getClientNavigation = (
  lang: Locale,
  dictionary: Dictionary
): ClientNavItem[] => [
  {
    id: 'invoices',
    href: `/${lang}/invoices`,
    label: dictionary.pages.home.navigation.invoices,
    tooltip: dictionary.tooltips.invoices,
    icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
  },
];

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
  const [profilePicture] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem('profilePicture') ?? undefined;
    } catch {
      return;
    }
  });

  const isPlatformUser = ['PLATFORM_ADMIN', 'PLATFORM_OWNER'].includes(
    user.role ?? ''
  );

  // Fetch businesses for client users
  const { data: businessesData, isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: () => BusinessService.getMyBusinesses(),
    enabled: !isPlatformUser,
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

  const displayName = user.firstName ?? user.username;
  const fallbackInitial = (user.firstName ?? user.username ?? 'U')
    .charAt(0)
    .toUpperCase();

  const platformNav = getPlatformNavigation(lang, dictionary);
  const clientNav = getClientNavigation(lang, dictionary);
  const businesses = businessesData?.businesses ?? [];

  return (
    <aside className="bg-background fixed inset-y-0 z-50 flex w-64 flex-col ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l">
      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {/* Platform Navigation */}
        {isPlatformUser && (
          <>
            {platformNav.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </>
        )}

        {/* Client Navigation */}
        {!isPlatformUser && (
          <>
            {clientNav.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Businesses Dropdown */}
            {businesses.length > 0 && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent! dark:hover:text-accent-foreground h-auto w-full justify-between gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                        disabled={isLoadingBusinesses}
                      >
                        <span className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span>
                            {isLoadingBusinesses
                              ? dictionary.pages.sidebar.loading
                              : dictionary.pages.sidebar.businessesLabel}
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{dictionary.pages.sidebar.viewYourBusinesses}</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  className="w-56"
                >
                  {isLoadingBusinesses ? (
                    <div className="flex items-center justify-center gap-2 px-2 py-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{dictionary.pages.sidebar.loading}</span>
                    </div>
                  ) : businesses.length === 0 ? (
                    <div className="text-muted-foreground px-2 py-2 text-sm">
                      {dictionary.pages.sidebar.noBusinessesFound}
                    </div>
                  ) : (
                    businesses.map((business) => (
                      <DropdownMenuItem key={business.id} asChild>
                        <Link
                          href={`/${lang}/business/${business.id}`}
                          className="flex cursor-pointer items-center justify-between gap-2"
                        >
                          <span className="flex-1 truncate font-medium">
                            {business.name}
                          </span>
                          {!business.isActive && (
                            <span className="text-muted-foreground text-xs">
                              {dictionary.pages.sidebar.businessInactive}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
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

      {/* Utilities (notifications + locale + theme) */}
      <div className="flex items-center justify-between border-t px-2 py-3">
        <Notifications lang={lang} />
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
