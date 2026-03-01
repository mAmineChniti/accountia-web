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
import { Trash2, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

// ✅ Statut actif/inactif basé sur dateJoined (connecté dans les 30 derniers jours = actif)
function getUserStatus(user: UserSummary): 'active' | 'inactive' {
  if (!user.dateJoined) return 'inactive';
  const joined = new Date(user.dateJoined);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return joined >= thirtyDaysAgo ? 'active' : 'inactive';
}

// ✅ Label du rôle
function getRoleLabel(role?: string): string {
  switch (role) {
    case 'PLATFORM_OWNER':  return 'Platform Owner';
    case 'PLATFORM_ADMIN':  return 'Platform Admin';
    case 'BUSINESS_OWNER':  return 'Business Owner';
    case 'BUSINESS_ADMIN':  return 'Business Admin';
    case 'CLIENT':          return 'Client';
    default:                return role ?? '—';
  }
}

// ✅ Couleur du badge rôle
function getRoleBadgeVariant(role?: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (role) {
    case 'PLATFORM_OWNER':
    case 'PLATFORM_ADMIN':  return 'default';
    case 'BUSINESS_OWNER':  return 'secondary';
    case 'BUSINESS_ADMIN':  return 'outline';
    default:                return 'outline';
  }
}

const formatDateOnly = (value?: string | null): string => {
  if (!value) return '-';
  return formatDateLong(value);
};

const EMPTY_USERS: UserSummary[] = [];

// ✅ Composant icône de tri
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
  return sortDir === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3" />
    : <ArrowDown className="ml-1 h-3 w-3" />;
}

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

  // ✅ Filtre par statut
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

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
  const totalAdmins = users.filter((u) => u.isAdmin).length;
  const totalActive = users.filter((u) => getUserStatus(u) === 'active').length;
  const modalUsername = modalUser ? modalUser.username : '';

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = users;

    if (q.length > 0) {
      filtered = filtered.filter((u) => {
        const haystack =
          `${u.username} ${u.email} ${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter((u) => {
        if (!u.dateJoined) return false;
        const joinDate = new Date(u.dateJoined);
        const joinDateOnly = new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate());
        const fromDateOnly = dateRange.from
          ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate())
          : undefined;
        const toDateOnly = dateRange.to
          ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate())
          : undefined;
        if (fromDateOnly && joinDateOnly < fromDateOnly) return false;
        if (toDateOnly && joinDateOnly > toDateOnly) return false;
        return true;
      });
    }

    // ✅ Filtre par statut actif/inactif
    if (statusFilter !== 'all') {
      filtered = filtered.filter((u) => getUserStatus(u) === statusFilter);
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
  }, [users, search, sortKey, sortDir, dateRange, statusFilter]);

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

      {/* ✅ Stats cards — ajout carte Active Users */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{dictionary.admin.stats.totalUsers}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? dictionary.admin.stats.placeholder : totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>

        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{dictionary.admin.stats.totalAdmins}</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? dictionary.admin.stats.placeholder : totalAdmins}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>

        {/* ✅ Nouvelle carte : utilisateurs actifs */}
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? dictionary.admin.stats.placeholder : totalActive}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{dictionary.admin.stats.lastUpdated}</CardDescription>
            <CardTitle className="text-base font-medium">
              {isFetching ? dictionary.admin.stats.refreshing : dictionary.admin.stats.upToDate}
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
            <div className="flex flex-col gap-2 md:w-[320px] md:flex-row md:items-center">
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

          {/* Filtres : date + statut */}
          <div className="flex flex-wrap gap-2 md:items-center">
            <div className="text-muted-foreground text-sm font-medium">
              {dictionary.admin.dateFilterLabel}
            </div>
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
                  onSelect={(range) => setDateRange(range)}
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

            {/* ✅ Filtre statut actif/inactif */}
            <div className="flex gap-1 ml-2">
              {(['all', 'active', 'inactive'] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={statusFilter === s ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(s)}
                  className="capitalize"
                >
                  {s === 'all' ? 'All' : s === 'active' ? '🟢 Active' : '⚪ Inactive'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="space-y-3">
              <div className="text-destructive text-sm">{dictionary.admin.loadError}</div>
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
              {users.length === 0 ? dictionary.admin.noUsers : dictionary.admin.noResults}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button type="button" variant="ghost" className="px-0" onClick={() => toggleSort('username')}>
                      {dictionary.admin.username}
                      <SortIcon col="username" sortKey={sortKey} sortDir={sortDir} />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button type="button" variant="ghost" className="px-0" onClick={() => toggleSort('email')}>
                      {dictionary.admin.email}
                      <SortIcon col="email" sortKey={sortKey} sortDir={sortDir} />
                    </Button>
                  </TableHead>
                  <TableHead>{dictionary.admin.firstName}</TableHead>
                  <TableHead>{dictionary.admin.lastName}</TableHead>
                  {/* ✅ Colonne Role */}
                  <TableHead>Role</TableHead>
                  {/* ✅ Colonne Admin badge */}
                  <TableHead>{dictionary.admin.isAdmin}</TableHead>
                  {/* ✅ Colonne Status */}
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button type="button" variant="ghost" className="px-0" onClick={() => toggleSort('dateJoined')}>
                      {dictionary.admin.dateJoined}
                      <SortIcon col="dateJoined" sortKey={sortKey} sortDir={sortDir} />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">{dictionary.admin.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const status = getUserStatus(user);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{user.firstName ?? '-'}</TableCell>
                      <TableCell>{user.lastName ?? '-'}</TableCell>

                      {/* ✅ Role badge */}
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant((user as any).role)}>
                          {getRoleLabel((user as any).role)}
                        </Badge>
                      </TableCell>

                      {/* Admin badge */}
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge variant="secondary">{dictionary.admin.adminBadge}</Badge>
                        ) : (
                          <Badge variant="outline">{dictionary.admin.userBadge}</Badge>
                        )}
                      </TableCell>

                      {/* ✅ Status actif/inactif */}
                      <TableCell>
                        {status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactive
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
                  );
                })}
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
              {dictionary.admin.deleteDialog.description.replace('{username}', modalUsername)}
            </DialogDescription>
          </DialogHeader>
          {deleteError && <div className="text-destructive text-sm">{deleteError}</div>}
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