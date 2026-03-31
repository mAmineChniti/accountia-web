/* eslint-disable unicorn/no-null, unicorn/numeric-separators-style, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, unicorn/no-array-for-each, unicorn/consistent-function-scoping, unicorn/switch-case-braces */
'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Loader2,
  Ban,
  ShieldCheck,
  Users as UsersIcon,
  UserPlus,
  Building,
  Clock,
} from 'lucide-react';

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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  formatDateLong,
  getCalendarLocale,
  getCalendarDirection,
} from '@/lib/date-utils';
import type { DateRange } from 'react-day-picker';
import type {
  Role,
  UserSummary,
  UsersListResponse,
} from '@/types/ResponseInterfaces';
import { AuthService, AdminStatsRequests } from '@/lib/requests';
import { toast } from 'sonner';
import { localizeErrorMessage } from '@/lib/error-localization';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import {
  Activity,
  History,
  User as UserIcon,
  Briefcase,
  Settings as SettingsIcon,
  ShieldAlert,
  Info,
  RotateCw,
} from 'lucide-react';

import type { Dictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';

type SortKey = 'username' | 'email' | 'dateJoined';
type SortDir = 'asc' | 'desc';

const formatDateOnly = (value?: string | null): string => {
  if (!value) return '-';
  return formatDateLong(value);
};

const EMPTY_USERS: UserSummary[] = [];

const ALL_ROLES: Role[] = [
  'PLATFORM_OWNER',
  'PLATFORM_ADMIN',
  'BUSINESS_OWNER',
  'BUSINESS_ADMIN',
  'CLIENT',
];

export default function Admin({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const queryClient = useQueryClient();
  const [modalUser, setModalUser] = useState<UserSummary | undefined>();
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [changingRoleUserId, setChangingRoleUserId] = useState<
    string | undefined
  >();
  const [banningUserId, setBanningUserId] = useState<string | undefined>();
  const [banModalUser, setBanModalUser] = useState<UserSummary | undefined>();
  const [banAction, setBanAction] = useState<'ban' | 'unban'>('ban');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('dateJoined');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data, isLoading, error, refetch, isFetching } =
    useQuery<UsersListResponse>({
      queryKey: ['users'],
      queryFn: AuthService.fetchAllUsers,
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const users = useMemo(() => data?.users ?? EMPTY_USERS, [data?.users]);

  const roleCounts = useMemo(() => {
    const counts = {
      PLATFORM_OWNER: 0,
      PLATFORM_ADMIN: 0,
      BUSINESS_OWNER: 0,
      BUSINESS_ADMIN: 0,
      CLIENT: 0,
    };
    users.forEach((u) => {
      const role = u.role as keyof typeof counts;
      if (role && role in counts) {
        counts[role]++;
      }
    });
    return counts;
  }, [users]);

  const totalUsers = users.length;

  const modalUsername = modalUser ? modalUser.username : '';
  const usersLoadErrorMessage = error
    ? localizeErrorMessage(error, dictionary, dictionary.admin.loadError)
    : dictionary.admin.loadError;

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = users;

    // Apply search filter
    if (q.length > 0) {
      filtered = filtered.filter((u) => {
        const haystack =
          `${u.username} ${u.email} ${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    // Apply date range filter
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter((u) => {
        const joinDate = u.dateJoined;
        if (!joinDate) return false;
        const date = new Date(joinDate);

        // Normalize dates to ignore time component
        const joinDateOnly = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const fromDateOnly = dateRange.from
          ? new Date(
              dateRange.from.getFullYear(),
              dateRange.from.getMonth(),
              dateRange.from.getDate()
            )
          : undefined;
        const toDateOnly = dateRange.to
          ? new Date(
              dateRange.to.getFullYear(),
              dateRange.to.getMonth(),
              dateRange.to.getDate()
            )
          : undefined;

        if (fromDateOnly && joinDateOnly < fromDateOnly) return false;
        if (toDateOnly && joinDateOnly > toDateOnly) return false;

        return true;
      });
    }

    const sorted = filtered.toSorted((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'dateJoined') {
        const aDate = a.dateJoined;
        const bDate = b.dateJoined;
        const aTime = aDate ? new Date(aDate).getTime() : 0;
        const bTime = bDate ? new Date(bDate).getTime() : 0;
        return (aTime - bTime) * dir;
      }
      const aVal = (a[sortKey] ?? a.dateJoined ?? '').toString().toLowerCase();
      const bVal = (b[sortKey] ?? b.dateJoined ?? '').toString().toLowerCase();
      return aVal.localeCompare(bVal) * dir;
    });

    return sorted;
  }, [users, search, sortKey, sortDir, dateRange]);

  const changeRoleMutation = useMutation({
    mutationFn: (data: { userId: string; newRole: Role }) =>
      AuthService.changeRole(data),
    onMutate: ({ userId }) => {
      setChangingRoleUserId(userId);
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        ['users'],
        (old: UsersListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((u) =>
              u.id === variables.userId ? { ...u, role: result.newRole } : u
            ),
          };
        }
      );
      toast.success(dictionary.admin.changeRoleSuccess);
      setChangingRoleUserId(undefined);
    },
    onError: (error: unknown) => {
      toast.error(
        localizeErrorMessage(
          error,
          dictionary,
          dictionary.admin.changeRoleError
        )
      );
      setChangingRoleUserId(undefined);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => AuthService.deactivateUserByAdmin(userId),
    onSuccess: (_: unknown, userId: string) => {
      queryClient.setQueryData(
        ['users'],
        (old: UsersListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((u) =>
              u.id === userId ? { ...u, isActive: false } : u
            ),
          };
        }
      );
      setModalUser(undefined);
      setDeleteError(undefined);
      toast.success(dictionary.admin.deleteSuccess);
    },
    onError: (error: unknown) => {
      setDeleteError(
        localizeErrorMessage(error, dictionary, dictionary.admin.deleteError)
      );
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => AuthService.reactivateUserByAdmin(userId),
    onSuccess: (_: unknown, userId: string) => {
      queryClient.setQueryData(
        ['users'],
        (old: UsersListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((u) =>
              u.id === userId ? { ...u, isActive: true } : u
            ),
          };
        }
      );
      toast.success(
        dictionary.admin.reactivateSuccess || 'User reactivated successfully'
      );
    },
    onError: (error: unknown) => {
      toast.error(
        localizeErrorMessage(error, dictionary, 'Failed to reactivate user')
      );
    },
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => AuthService.banUser(userId),
    onMutate: (userId) => {
      setBanningUserId(userId);
    },
    onSuccess: (_: unknown, userId: string) => {
      queryClient.setQueryData(
        ['users'],
        (old: UsersListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((u) =>
              u.id === userId ? { ...u, isBanned: true } : u
            ),
          };
        }
      );
      setBanModalUser(undefined);
      toast.success(dictionary.admin.banSuccess);
    },
    onError: (error: unknown) => {
      toast.error(
        localizeErrorMessage(error, dictionary, dictionary.admin.banError)
      );
    },
    onSettled: () => {
      setBanningUserId(undefined);
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => AuthService.unbanUser(userId),
    onMutate: (userId) => {
      setBanningUserId(userId);
    },
    onSuccess: (_: unknown, userId: string) => {
      queryClient.setQueryData(
        ['users'],
        (old: UsersListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((u) =>
              u.id === userId ? { ...u, isBanned: false } : u
            ),
          };
        }
      );
      setBanModalUser(undefined);
      toast.success(dictionary.admin.unbanSuccess);
    },
    onError: (error: unknown) => {
      toast.error(
        localizeErrorMessage(error, dictionary, dictionary.admin.unbanError)
      );
    },
    onSettled: () => {
      setBanningUserId(undefined);
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold tracking-tight">
            Admin Dashboard
          </div>
          <div className="text-muted-foreground">
            Manage users and access controls
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${lang}/dashboard/businesses`}>
            {dictionary.admin.businessManagement.navLabel}
          </Link>
        </Button>
      </div>
      {/* Users By Role */}
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

      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{dictionary.admin.usersTitle}</CardTitle>
              <CardDescription>{dictionary.admin.tableCaption}</CardDescription>
            </div>
            <div className="flex flex-row gap-2 md:w-auto md:items-center">
              <div className="relative w-full md:w-64">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={dictionary.admin.searchPlaceholder}
                  className="pr-10"
                />
                {search && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                title={dictionary.admin.stats.syncButton}
                className={cn('shrink-0', isFetching && 'animate-spin')}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="text-muted-foreground text-sm font-medium">
              {dictionary.admin.dateFilterLabel}
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dateRange?.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from
                      ? dateRange.to
                        ? `${formatDateLong(dateRange.from.toISOString())} - ${formatDateLong(dateRange.to.toISOString())}`
                        : formatDateLong(dateRange.from.toISOString())
                      : dictionary.admin.dateFilterPlaceholder}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                    }}
                    numberOfMonths={2}
                    disabled={(date) => date > new Date()}
                    captionLayout="dropdown"
                    locale={getCalendarLocale(lang)}
                    dir={getCalendarDirection(lang)}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                onClick={() => setDateRange(undefined)}
                disabled={!dateRange?.from && !dateRange?.to}
              >
                {dictionary.common.clear}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="space-y-3">
              <div className="text-destructive text-sm">
                {usersLoadErrorMessage}
              </div>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                {dictionary.common.retry}
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              {users.length === 0
                ? dictionary.admin.noUsers
                : dictionary.admin.noResults}
            </div>
          ) : (
            <div className="divide-border flex flex-col divide-y">
              {/* Table Header */}
              <div className="text-muted-foreground grid grid-cols-[2fr_2.5fr_1fr_1.5fr_auto] gap-4 px-4 py-2 text-xs font-semibold tracking-wider uppercase">
                <button
                  type="button"
                  className="hover:text-foreground flex items-center gap-1 transition-colors select-none"
                  onClick={() => toggleSort('username')}
                >
                  {dictionary.admin.username}
                  {sortKey === 'username' ? (
                    sortDir === 'asc' ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  )}
                </button>
                <button
                  type="button"
                  className="hover:text-foreground flex items-center gap-1 transition-colors select-none"
                  onClick={() => toggleSort('email')}
                >
                  {dictionary.admin.email}
                  {sortKey === 'email' ? (
                    sortDir === 'asc' ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  )}
                </button>
                <span>{dictionary.admin.status || 'Status'}</span>
                <span>{dictionary.admin.roleColumn}</span>
                <span className="text-right">{dictionary.admin.actions}</span>
              </div>
              {/* Rows */}
              {filteredUsers.map((user) => {
                const initials =
                  `${user.firstName?.charAt(0) ?? user.username.charAt(0)}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
                const roleColors: Record<string, string> = {
                  PLATFORM_OWNER:
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                  PLATFORM_ADMIN:
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                  BUSINESS_OWNER:
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                  BUSINESS_ADMIN:
                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                  CLIENT:
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                };
                const roleClass =
                  roleColors[user.role ?? 'CLIENT'] ?? roleColors.CLIENT;
                return (
                  <div
                    key={user.id}
                    className="hover:bg-muted/30 grid grid-cols-[2fr_2.5fr_1fr_1.5fr_auto] items-center gap-4 px-4 py-3 transition-colors"
                  >
                    {/* User + Avatar */}
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-foreground truncate text-sm font-semibold">
                          {user.username}
                        </div>
                        <div className="text-muted-foreground truncate text-[11px]">
                          {user.firstName ?? ''} {user.lastName ?? ''}
                        </div>
                      </div>
                    </div>
                    {/* Email */}
                    <div className="text-muted-foreground truncate text-sm">
                      {user.email}
                    </div>
                    {/* Status */}
                    <div>
                      {user.isActive === false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                          {dictionary.admin.statusInactive || 'Inactive'}
                        </span>
                      ) : user.isBanned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                          {dictionary.admin.statusActive || 'Active'}
                        </span>
                      )}
                    </div>
                    {/* Role dropdown */}
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            disabled={changingRoleUserId === user.id}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-80',
                              roleClass
                            )}
                          >
                            {changingRoleUserId === user.id && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {dictionary.admin.roles[user.role ?? 'CLIENT']}
                            <ChevronDown className="ml-0.5 h-2.5 w-2.5 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {ALL_ROLES.map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onSelect={() => {
                                if (role !== user.role)
                                  changeRoleMutation.mutate({
                                    userId: user.id,
                                    newRole: role,
                                  });
                              }}
                              className={cn(
                                'text-xs',
                                role === user.role && 'font-semibold'
                              )}
                            >
                              {dictionary.admin.roles[role]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant={
                          user.isActive === false ? 'default' : 'destructive'
                        }
                        size="sm"
                        className="h-7 gap-1 px-2 text-[11px]"
                        onClick={() => {
                          if (user.isActive === false) {
                            reactivateMutation.mutate(user.id);
                          } else {
                            setModalUser(user);
                            setDeleteError(undefined);
                          }
                        }}
                        disabled={
                          deactivateMutation.isPending ||
                          reactivateMutation.isPending
                        }
                      >
                        {user.isActive === false ? (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            <span className="font-bold tracking-tight uppercase">
                              {dictionary.admin.reactivateUser || 'Reactivate'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3" />
                            <span className="font-bold tracking-tight uppercase">
                              {dictionary.admin.deactivateUser || 'Deactivate'}
                            </span>
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant={
                          user.isBanned === true ? 'outline' : 'secondary'
                        }
                        size="sm"
                        className="h-7 gap-1 px-2 text-[11px]"
                        onClick={() => {
                          setBanModalUser(user);
                          setBanAction(
                            user.isBanned === true ? 'unban' : 'ban'
                          );
                        }}
                        disabled={banningUserId === user.id}
                      >
                        {user.isBanned === true ? (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            <span className="font-bold tracking-tight uppercase">
                              {dictionary.admin.unbanUser || 'Unban'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Ban className="h-3 w-3" />
                            <span className="font-bold tracking-tight uppercase">
                              {dictionary.admin.banUser || 'Ban'}
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={modalUser !== undefined}
        onOpenChange={(open) => {
          if (!open) setModalUser(undefined);
          setDeleteError(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary.admin.deleteDialog.title}</DialogTitle>
            <DialogDescription>
              {dictionary.admin.deleteDialog.description.replace(
                '{username}',
                modalUsername
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="text-destructive text-sm">{deleteError}</div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalUser(undefined)}
              disabled={deactivateMutation.isPending}
            >
              {dictionary.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!modalUser) return;
                deactivateMutation.mutate(modalUser.id);
              }}
              disabled={deactivateMutation.isPending || !modalUser}
            >
              {deactivateMutation.isPending
                ? dictionary.admin.deleteDialog.deleting
                : dictionary.admin.deleteDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={banModalUser !== undefined}
        onOpenChange={(open) => {
          if (!open) setBanModalUser(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banAction === 'ban'
                ? dictionary.admin.banDialog.title
                : dictionary.admin.unbanDialog.title}
            </DialogTitle>
            <DialogDescription>
              {(banAction === 'ban'
                ? dictionary.admin.banDialog.description
                : dictionary.admin.unbanDialog.description
              ).replace('{username}', banModalUser?.username ?? '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setBanModalUser(undefined)}
              disabled={banMutation.isPending || unbanMutation.isPending}
            >
              {dictionary.common.cancel}
            </Button>
            <Button
              type="button"
              variant={banAction === 'ban' ? 'destructive' : 'default'}
              onClick={() => {
                if (!banModalUser) return;
                if (banAction === 'ban') banMutation.mutate(banModalUser.id);
                else unbanMutation.mutate(banModalUser.id);
              }}
              disabled={
                banMutation.isPending ||
                unbanMutation.isPending ||
                !banModalUser
              }
            >
              {banMutation.isPending || unbanMutation.isPending
                ? banAction === 'ban'
                  ? dictionary.admin.banDialog.banning
                  : dictionary.admin.unbanDialog.unbanning
                : banAction === 'ban'
                  ? dictionary.admin.banDialog.confirm
                  : dictionary.admin.unbanDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Timeline Section */}
      <ActivityTimeline dictionary={dictionary} lang={lang} />
    </div>
  );
}

function ActivityTimeline({
  dictionary,
  lang,
}: {
  dictionary: any;
  lang: string;
}) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [countdown, setCountdown] = useState(30);

  const fetchLogs = async () => {
    try {
      const data = await AdminStatsRequests.getAuditLogs(20);
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    setCountdown(30);
    const interval = setInterval(() => {
      fetchLogs();
      setCountdown(30);
    }, 30000);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/20';
      case 'DELETE':
        return 'text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/20';
      case 'UPDATE':
        return 'text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/20';
      case 'LOGIN':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/20';
      default:
        return 'text-muted-foreground bg-muted/50';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'User':
        return <UserIcon className="h-4 w-4" />;
      case 'Business':
      case 'BusinessApplication':
        return <Briefcase className="h-4 w-4" />;
      case 'Settings':
        return <SettingsIcon className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: lang === 'fr' ? fr : enUS,
      });
    } catch {
      return date;
    }
  };

  return (
    <Card className="dark:bg-card/90 overflow-hidden border-0 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <History className="text-primary h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>Real-time platform audit logs</CardDescription>
        </div>
        {/* Countdown pill - same style as stats */}
        <div className="flex w-fit shrink-0 items-center gap-2">
          <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
              <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
            </span>
            {countdown}s
          </span>
          <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 30) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && logs.length === 0 ? (
          <div className="space-y-1 p-4">
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center italic">
            No recent activity recorded.
          </div>
        ) : (
          <div className="flex flex-col">
            {logs.map((log) => (
              <div
                key={log._id}
                className="hover:bg-muted/30 border-muted/20 group relative flex cursor-pointer items-center gap-3 border-b px-4 py-2 transition-colors last:border-0"
                onClick={() => setSelectedLog(log)}
              >
                <div
                  className={cn(
                    'bg-background z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm',
                    getActionColor(log.action).split(' ')[1]
                  )}
                >
                  <div className={getActionColor(log.action).split(' ')[0]}>
                    {getResourceIcon(log.resource)}
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-foreground truncate text-sm font-semibold">
                      {log.username}
                    </span>
                    <span
                      className={cn(
                        'rounded-[4px] px-1.5 py-px text-[10px] font-bold tracking-wider uppercase',
                        getActionColor(log.action)
                      )}
                    >
                      {log.action}
                    </span>
                    <span className="text-muted-foreground hidden text-xs sm:inline">
                      on {log.resource}
                    </span>

                    {log.details &&
                      (log.details.message ||
                        log.details.businessName ||
                        log.details.targetUsername) && (
                        <span className="text-muted-foreground/60 ml-1 hidden truncate text-xs italic md:block">
                          —{' '}
                          {log.details.message ||
                            (log.details.businessName
                              ? `Business: ${log.details.businessName}`
                              : null) ||
                            (log.details.targetUsername
                              ? `Target: ${log.details.targetUsername}`
                              : null)}
                        </span>
                      )}
                  </div>

                  <time className="text-muted-foreground text-[11px] whitespace-nowrap tabular-nums">
                    {getRelativeTime(log.createdAt)}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Log Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Activity Details
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground text-sm font-medium">
                  User
                </span>
                <span className="col-span-2 text-sm font-semibold">
                  {selectedLog.username} ({selectedLog.userId})
                </span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground text-sm font-medium">
                  Action
                </span>
                <span className="col-span-2">
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-[11px] font-bold',
                      getActionColor(selectedLog.action)
                    )}
                  >
                    {selectedLog.action}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground text-sm font-medium">
                  Resource
                </span>
                <span className="col-span-2 text-sm">
                  {selectedLog.resource}
                </span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground text-sm font-medium">
                  Timestamp
                </span>
                <span className="col-span-2 text-sm">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>
              {selectedLog.details && (
                <div className="mt-2 space-y-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    <Info className="h-4 w-4" />
                    Technical Details
                  </div>
                  <pre className="bg-muted max-h-40 overflow-auto rounded-md p-3 font-mono text-[10px]">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedLog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
