'use client';
import { useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Loader2,
  Ban,
  ShieldCheck,
} from 'lucide-react';
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
  ChangeRoleResponse,
} from '@/types/services';
import { AuthService } from '@/lib/requests';
import { toast } from 'sonner';
import { localizeErrorMessage } from '@/lib/error-localization';

import type { Dictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';

type SortKey = 'username' | 'email' | 'dateJoined';
type SortDir = 'asc' | 'desc';

const formatDateOnly = (value?: string | null): string => {
  if (!value) return '-';
  return formatDateLong(value);
};

const EMPTY_USERS: UserSummary[] = [];
const ALL_ROLES: Role[] = ['PLATFORM_OWNER', 'PLATFORM_ADMIN', 'CLIENT'];

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
  const [banReason, setBanReason] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('dateJoined');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data, isLoading, error, refetch, isFetching } =
    useQuery<UsersListResponse>({
      queryKey: ['users'],
      queryFn: AuthService.fetchAllUsers,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 45 * 60 * 1000, // 45 minutes - admin user lists don't change often
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
  const totalUsers = users.length;
  const totalAdmins = users.filter((u: UserSummary) =>
    ['PLATFORM_ADMIN', 'PLATFORM_OWNER'].includes(u.role ?? '')
  ).length;
  const modalUsername = modalUser ? modalUser.username : '';
  const usersLoadErrorMessage = error
    ? localizeErrorMessage(error, dictionary, dictionary.admin.loadError)
    : dictionary.admin.loadError;

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = users;

    // Apply search filter
    if (q.length > 0) {
      filtered = filtered.filter((u: UserSummary) => {
        const haystack =
          `${u.username} ${u.email} ${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    // Apply date range filter
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter((u: UserSummary) => {
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

    const sorted = filtered.toSorted((a: UserSummary, b: UserSummary) => {
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
    onMutate: ({ userId }: { userId: string; newRole: Role }) => {
      setChangingRoleUserId(userId);
    },
    onSuccess: (
      result: ChangeRoleResponse,
      variables: { userId: string; newRole: Role }
    ) => {
      queryClient.setQueryData(
        ['users'],
        (old: UsersListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((u: UserSummary) =>
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

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => AuthService.deleteUserByAdmin(userId),
    onSuccess: (_: unknown, userId: string) => {
      queryClient.setQueryData(
        ['users'],
        (old: UsersListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.filter((u: UserSummary) => u.id !== userId),
          };
        }
      );
      setModalUser(undefined);
      setDeleteError(undefined);
    },
    onError: (error: unknown) => {
      setDeleteError(
        localizeErrorMessage(error, dictionary, dictionary.admin.deleteError)
      );
    },
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      AuthService.banUser(userId, reason),
    onMutate: ({ userId }: { userId: string; reason: string }) => {
      setBanningUserId(userId);
    },
    onSuccess: (_: unknown, { userId }: { userId: string; reason: string }) => {
      queryClient.setQueryData(
        ['users'],
        (old: UsersListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((u: UserSummary) =>
              u.id === userId ? { ...u, isBanned: true } : u
            ),
          };
        }
      );
      setBanModalUser(undefined);
      setBanReason('');
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
    onMutate: (userId: string) => {
      setBanningUserId(userId);
    },
    onSuccess: (_: unknown, userId: string) => {
      queryClient.setQueryData(
        ['users'],
        (old: UsersListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((u: UserSummary) =>
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
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold tracking-tight">
            {dictionary.admin.title}
          </div>
          <div className="text-muted-foreground">
            {dictionary.admin.subtitle}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${lang}/dashboard/businesses`}>
            {dictionary.admin.businessManagement.navLabel}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>
              {dictionary.admin.stats.totalUsers}
            </CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? dictionary.admin.stats.placeholder : totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>
              {dictionary.admin.stats.totalAdmins}
            </CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? dictionary.admin.stats.placeholder : totalAdmins}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>
              {dictionary.admin.stats.lastUpdated}
            </CardDescription>
            <CardTitle className="text-base font-medium">
              {isFetching
                ? dictionary.admin.stats.refreshing
                : dictionary.admin.stats.upToDate}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {dictionary.admin.stats.syncButton}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{dictionary.admin.usersTitle}</CardTitle>
              <CardDescription>{dictionary.admin.tableCaption}</CardDescription>
            </div>
            <div className="flex flex-col gap-2 md:w-xs md:flex-row md:items-center">
              <div className="relative flex-1">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={dictionary.admin.searchPlaceholder}
                  className="flex-1 pr-10"
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto gap-1 font-normal"
                      onClick={() => toggleSort('username')}
                    >
                      {dictionary.admin.username}
                      {sortKey === 'username' ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="text-muted-foreground h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto gap-1 font-normal"
                      onClick={() => toggleSort('email')}
                    >
                      {dictionary.admin.email}
                      {sortKey === 'email' ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="text-muted-foreground h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>{dictionary.admin.firstName}</TableHead>
                  <TableHead>{dictionary.admin.lastName}</TableHead>
                  <TableHead>{dictionary.admin.roleColumn}</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto gap-1 font-normal"
                      onClick={() => toggleSort('dateJoined')}
                    >
                      {dictionary.admin.dateJoined}
                      {sortKey === 'dateJoined' ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="text-muted-foreground h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    {dictionary.admin.actions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: UserSummary) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.firstName ?? '-'}</TableCell>
                    <TableCell>{user.lastName ?? '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={changingRoleUserId === user.id}
                            className="h-8 gap-1.5 px-2 text-xs font-normal"
                          >
                            {changingRoleUserId === user.id && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {dictionary.admin.roles[user.role ?? 'CLIENT']}
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {ALL_ROLES.map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onSelect={() => {
                                if (role !== user.role) {
                                  changeRoleMutation.mutate({
                                    userId: user.id,
                                    newRole: role,
                                  });
                                }
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
                    </TableCell>
                    <TableCell>{formatDateOnly(user.dateJoined)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant={
                            user.isBanned === true ? 'outline' : 'secondary'
                          }
                          size="icon"
                          className="rounded-full"
                          onClick={() => {
                            setBanModalUser(user);
                            setBanAction(
                              user.isBanned === true ? 'unban' : 'ban'
                            );
                          }}
                          disabled={banningUserId === user.id}
                          aria-label={
                            user.isBanned === true
                              ? dictionary.admin.unbanUser
                              : dictionary.admin.banUser
                          }
                        >
                          {user.isBanned === true ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="rounded-full"
                          onClick={() => {
                            setModalUser(user);
                            setDeleteError(undefined);
                          }}
                          disabled={deleteMutation.isPending}
                          aria-label={dictionary.common.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={modalUser !== undefined}
        onOpenChange={(open: boolean) => {
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
              disabled={deleteMutation.isPending}
            >
              {dictionary.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!modalUser) return;
                deleteMutation.mutate(modalUser.id);
              }}
              disabled={deleteMutation.isPending || !modalUser}
            >
              {deleteMutation.isPending
                ? dictionary.admin.deleteDialog.deleting
                : dictionary.admin.deleteDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={banModalUser !== undefined}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setBanModalUser(undefined);
            setBanReason('');
          }
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
          {banAction === 'ban' && (
            <div className="space-y-3">
              <Label htmlFor="ban-reason" className="text-sm font-medium">
                {dictionary.admin.banDialog.reason}
              </Label>
              <Input
                id="ban-reason"
                placeholder={dictionary.admin.banDialog.reason}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                disabled={banMutation.isPending}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setBanModalUser(undefined);
                setBanReason('');
              }}
              disabled={banMutation.isPending || unbanMutation.isPending}
            >
              {dictionary.common.cancel}
            </Button>
            <Button
              type="button"
              variant={banAction === 'ban' ? 'destructive' : 'default'}
              onClick={() => {
                if (!banModalUser) return;
                if (banAction === 'ban') {
                  if (!banReason.trim()) {
                    toast.error(dictionary.admin.banDialog.reasonRequired);
                    return;
                  }
                  banMutation.mutate({
                    userId: banModalUser.id,
                    reason: banReason.trim(),
                  });
                } else {
                  unbanMutation.mutate(banModalUser.id);
                }
              }}
              disabled={
                banMutation.isPending ||
                unbanMutation.isPending ||
                !banModalUser ||
                (banAction === 'ban' && !banReason.trim())
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
    </div>
  );
}
