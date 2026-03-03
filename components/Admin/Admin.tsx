'use client';
import { useMemo, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Trash2, X, Users, ShieldCheck, User, RefreshCw } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import {
  formatDateLong,
  getCalendarLocale,
  getCalendarDirection,
} from '@/lib/date-utils';
import type { DateRange } from 'react-day-picker';
import type {
  UserSummary,
  UsersListResponse,
} from '@/types/ResponseInterfaces';
import { AuthService } from '@/lib/requests';

import type { Dictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';

type SortKey = 'username' | 'email' | 'dateJoined';
type SortDir = 'asc' | 'desc';

const formatDateOnly = (value?: string | null): string => {
  if (!value) return '-';
  return formatDateLong(value);
};

const EMPTY_USERS: UserSummary[] = [];

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
  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.isAdmin || u.is_admin).length;
  const totalNormalUsers = totalUsers - totalAdmins;
  const modalUsername = modalUser ? modalUser.username : '';

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = users;

    // Apply search filter
    if (q.length > 0) {
      filtered = filtered.filter((u) => {
        const haystack =
          `${u.username} ${u.email} ${u.firstName ?? u.first_name ?? ''} ${u.lastName ?? u.last_name ?? ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    // Apply date range filter
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter((u) => {
        if (!u.dateJoined) return false;
        const joinDate = new Date(u.dateJoined);

        // Normalize dates to ignore time component
        const joinDateOnly = new Date(
          joinDate.getFullYear(),
          joinDate.getMonth(),
          joinDate.getDate()
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
        const aTime = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
        const bTime = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
        return (aTime - bTime) * dir;
      }
      const aVal = (a[sortKey] ?? '').toString().toLowerCase();
      const bVal = (b[sortKey] ?? '').toString().toLowerCase();
      return aVal.localeCompare(bVal) * dir;
    });

    return sorted;
  }, [users, search, sortKey, sortDir, dateRange]);

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => AuthService.deleteUserByAdmin(userId),
    onSuccess: (_: unknown, userId: string) => {
      queryClient.setQueryData(
        ['users'],
        (old: UsersListResponse | undefined) => {
          if (!old) return old;
          return { ...old, users: old.users.filter((u) => u.id !== userId) };
        }
      );
      setModalUser(undefined);
      setDeleteError(undefined);
    },
    onError: () => {
      setDeleteError(dictionary.admin.deleteError);
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-bold tracking-tight">
          {dictionary.admin.title}
        </div>
        <div className="text-muted-foreground">{dictionary.admin.subtitle}</div>
      </div>

      {/* Premium Stat Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

        {/* Total Users */}
        <div className="group relative overflow-hidden rounded-3xl border-0 bg-white/90 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-card/90">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                {dictionary.admin.stats.totalUsers}
              </p>
              <div className="text-5xl font-extrabold tracking-tight leading-none mt-2">
                {isLoading ? <Skeleton className="h-10 w-16 mt-1" /> : totalUsers}
              </div>
            </div>
            <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-primary/20 mt-5 h-2 w-full rounded-full">
            <div className="bg-primary h-2 w-full rounded-full" />
          </div>
        </div>

        {/* Admins */}
        <div className="group relative overflow-hidden rounded-3xl border-0 bg-white/90 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-card/90">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                {dictionary.admin.stats.totalAdmins}
              </p>
              <div className="text-5xl font-extrabold tracking-tight leading-none mt-2">
                {isLoading ? <Skeleton className="h-10 w-16 mt-1" /> : totalAdmins}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-5 h-2 w-full rounded-full bg-secondary/50">
            <div
              className="h-2 rounded-full bg-secondary-foreground/40 transition-all duration-500"
              style={{ width: totalUsers > 0 ? `${(totalAdmins / totalUsers) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Normal Users */}
        <div className="group relative overflow-hidden rounded-3xl border-0 bg-white/90 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-card/90">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                {dictionary.admin.stats.totalNormalUsers}
              </p>
              <div className="text-5xl font-extrabold tracking-tight leading-none mt-2">
                {isLoading ? <Skeleton className="h-10 w-16 mt-1" /> : totalNormalUsers}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
              <User className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-5 h-2 w-full rounded-full bg-accent/50">
            <div
              className="h-2 rounded-full bg-accent-foreground/40 transition-all duration-500"
              style={{ width: totalUsers > 0 ? `${(totalNormalUsers / totalUsers) * 100}%` : '0%' }}
            />
          </div>
        </div>

      </div>

      {/* Users Table Card */}
      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{dictionary.admin.usersTitle}</CardTitle>
              <CardDescription>{dictionary.admin.tableCaption}</CardDescription>
            </div>
            {/* Search + Sync inline */}
            <div className="flex items-center gap-2 md:w-[400px]">
              <div className="relative flex-1">
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
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex h-9 shrink-0 items-center gap-1.5"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
                {dictionary.admin.stats.syncButton}
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
                    onSelect={(range) => { setDateRange(range); }}
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
                {dictionary.admin.loadError}
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
                      type="button"
                      variant="ghost"
                      className="px-0"
                      onClick={() => toggleSort('username')}
                    >
                      {dictionary.admin.username}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-0"
                      onClick={() => toggleSort('email')}
                    >
                      {dictionary.admin.email}
                    </Button>
                  </TableHead>
                  <TableHead>{dictionary.admin.firstName}</TableHead>
                  <TableHead>{dictionary.admin.lastName}</TableHead>
                  <TableHead>{dictionary.admin.isAdmin}</TableHead>
                  <TableHead>
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-0"
                      onClick={() => toggleSort('dateJoined')}
                    >
                      {dictionary.admin.dateJoined}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    {dictionary.admin.actions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.firstName ?? user.first_name ?? '-'}</TableCell>
                    <TableCell>{user.lastName ?? user.last_name ?? '-'}</TableCell>
                    <TableCell>
                      {user.isAdmin || user.is_admin ? (
                        <Badge variant="secondary">
                          {dictionary.admin.adminBadge}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {dictionary.admin.userBadge}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDateOnly(user.dateJoined)}</TableCell>
                    <TableCell className="text-right">
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
    </div>
  );
}
