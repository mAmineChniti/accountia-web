'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  FileText,
  Package,
  BarChart3,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
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
  {
    id: 'logs',
    href: `/${lang}/dashboard/logs`,
    label: dictionary.admin.logs.navLabel,
    tooltip: dictionary.tooltips.logs,
    icon: <ScrollText className="h-4 w-4 shrink-0" />,
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
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [profilePicture] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem('profilePicture') ?? undefined;
    } catch {
      return;
    }
  });
  const [expandedBusinesses, setExpandedBusinesses] = useState<Set<string>>(
    new Set()
  );

  const toggleBusinessExpanded = (businessId: string) => {
    const newExpanded = new Set(expandedBusinesses);
    if (newExpanded.has(businessId)) {
      newExpanded.delete(businessId);
    } else {
      newExpanded.add(businessId);
    }
    setExpandedBusinesses(newExpanded);
  };

  const isPlatformUser = ['PLATFORM_ADMIN', 'PLATFORM_OWNER'].includes(
    user.role ?? ''
  );

  // Fetch businesses for client users
  const { data: businessesData, isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: () => BusinessService.getMyBusinesses(),
    enabled: !isPlatformUser,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
  });

  const handlePostLogout = async () => {
    try {
      localStorage.removeItem('profilePicture');
    } catch {}
    globalThis.dispatchEvent(
      new CustomEvent('auth:changed', { detail: { action: 'logout' } })
    );
    router.refresh();
    router.push(`/${lang}/login`);
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: async () => {
      // Clear all cached data on logout
      queryClient.clear();
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
    <Sidebar className="border-r">
      <SidebarContent>
        {/* Platform Navigation */}
        {isPlatformUser && (
          <SidebarGroup>
            <SidebarMenu className="gap-2">
              {platformNav.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.tooltip}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground transition-all'
                    )}
                  >
                    <Link href={item.href}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Client Navigation */}
        {!isPlatformUser && (
          <>
            <SidebarGroup>
              <SidebarMenu className="gap-2">
                {clientNav.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.tooltip}
                      className={cn(
                        'hover:bg-accent hover:text-accent-foreground transition-all'
                      )}
                    >
                      <Link href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            {/* Businesses List */}
            {businesses.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>
                  {isLoadingBusinesses
                    ? dictionary.pages.sidebar.loading
                    : dictionary.pages.sidebar.businessesLabel}
                </SidebarGroupLabel>
                <SidebarMenu className="gap-2">
                  {businesses.map((business) => {
                    const businessHref = `/${lang}/business/${business.id}`;
                    const issuedInvoicesHref = `/${lang}/business/${business.id}/invoices`;
                    const receivedInvoicesHref = `/${lang}/business/${business.id}/company-invoices`;
                    const statisticsHref = `/${lang}/business/${business.id}/statistics`;
                    const isBusinessActive =
                      pathname === businessHref ||
                      pathname === issuedInvoicesHref ||
                      pathname === receivedInvoicesHref ||
                      pathname === statisticsHref;
                    const isExpanded = expandedBusinesses.has(business.id);

                    return (
                      <SidebarMenuItem key={business.id}>
                        <div className="flex items-center">
                          <SidebarMenuButton
                            asChild
                            isActive={isBusinessActive}
                            className={cn(
                              'hover:bg-accent hover:text-accent-foreground flex-1 transition-all'
                            )}
                          >
                            <Link href={businessHref}>
                              <Building2 className="h-4 w-4" />
                              <span className="truncate">{business.name}</span>
                            </Link>
                          </SidebarMenuButton>
                          <button
                            type="button"
                            onClick={() => toggleBusinessExpanded(business.id)}
                            className={cn(
                              'ml-auto h-4 w-4 transition-transform',
                              isExpanded && 'rotate-180'
                            )}
                            aria-label={`Toggle ${business.name} details`}
                            aria-expanded={isExpanded}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        {isExpanded && (
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === issuedInvoicesHref}
                              >
                                <Link href={issuedInvoicesHref}>
                                  <FileText className="h-4 w-4" />
                                  <span>
                                    {dictionary.pages.invoices.issuedInvoices}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === receivedInvoicesHref}
                              >
                                <Link href={receivedInvoicesHref}>
                                  <FileText className="h-4 w-4" />
                                  <span>
                                    {dictionary.pages.invoices.receivedInvoices}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={
                                  pathname ===
                                  `/${lang}/business/${business.id}/products`
                                }
                              >
                                <Link
                                  href={`/${lang}/business/${business.id}/products`}
                                >
                                  <Package className="h-4 w-4" />
                                  <span>
                                    {dictionary.pages.business.viewProducts}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === statisticsHref}
                              >
                                <Link href={statisticsHref}>
                                  <BarChart3 className="h-4 w-4" />
                                  <span>
                                    {dictionary.pages.business.statistics ||
                                      'Statistics'}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      {/* Footer with Profile, Logout, and Utilities */}
      <SidebarFooter>
        {/* Profile link */}
        <div className="mb-3">
          <Link
            href={`/${lang}/profile`}
            className="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={profilePicture} alt={displayName} />
              <AvatarFallback className="text-xs font-semibold">
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{displayName}</span>
          </Link>
        </div>

        <Separator className="my-2" />

        {/* Logout */}
        <Button
          variant="ghost"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground h-auto w-full justify-start gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {dictionary.pages.home.navigation.logout}
        </Button>

        <Separator className="my-2" />

        {/* Utilities (notifications + locale + theme) */}
        <div className="flex items-center justify-center gap-1">
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
              <Notifications lang={lang} dictionary={dictionary} />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{dictionary.tooltips.notifications}</p>
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
      </SidebarFooter>
    </Sidebar>
  );
}
