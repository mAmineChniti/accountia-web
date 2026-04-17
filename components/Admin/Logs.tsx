'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { localizeErrorMessage } from '@/lib/error-localization';
import { AuditService } from '@/lib/requests';
import type { Dictionary } from '@/get-dictionary';
import type { Locale } from '@/i18n-config';
import {
  AuditAction,
  type AuditLog,
  type AuditLogListResponse,
} from '@/types/services';

const PAGE_LIMIT = 20;
const ALL_ACTIONS = 'ALL_ACTIONS';
const EMPTY_LOGS: AuditLog[] = [];

const actionVariants: Partial<Record<AuditAction, 'default' | 'secondary'>> = {
  LOGIN: 'default',
  REGISTER: 'default',
  LOGOUT: 'secondary',
  FAILED_LOGIN: 'secondary',
  BAN_USER: 'secondary',
  UNBAN_USER: 'default',
};

const getActionVariant = (action: AuditAction): 'default' | 'secondary' =>
  actionVariants[action] ?? 'secondary';

const getIntlLocale = (lang: Locale): string => {
  if (lang === 'ar') return 'ar-SA';
  if (lang === 'fr') return 'fr-FR';
  return 'en-US';
};

const formatAuditDate = (log: AuditLog, lang: Locale): string => {
  const value = log.createdAt ?? log.timestamp;
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat(getIntlLocale(lang), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getActionLabel = (action: AuditAction, dictionary: Dictionary): string =>
  dictionary.admin.logs.actions[action] ?? action;

const isAuditAction = (value: unknown): value is AuditAction =>
  typeof value === 'string' &&
  Object.values(AuditAction).includes(value as AuditAction);

const getSearchIndex = (log: AuditLog): string =>
  [
    log.action,
    log.userEmail,
    log.userId,
    log.userRole,
    log.target ?? '',
    JSON.stringify(log.details ?? {}),
  ]
    .join(' ')
    .toLowerCase();

export default function Logs({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const t = dictionary.admin.logs;
  const isArabic = lang === 'ar';
  const dateColumnClass = isArabic ? 'text-right' : 'text-left';
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>(ALL_ACTIONS);
  const [search, setSearch] = useState('');

  const selectedAction =
    actionFilter === ALL_ACTIONS
      ? undefined
      : isAuditAction(actionFilter)
        ? actionFilter
        : undefined;

  const { data, isLoading, isFetching, error, refetch } =
    useQuery<AuditLogListResponse>({
      queryKey: ['audit-logs', page, PAGE_LIMIT, selectedAction],
      queryFn: () =>
        AuditService.getAuditLogs(page, PAGE_LIMIT, selectedAction),
      staleTime: 2 * 60 * 1000,
      gcTime: 20 * 60 * 1000,
    });

  const logs = data?.logs ?? EMPTY_LOGS;
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => getSearchIndex(log).includes(q));
  }, [logs, search]);

  const loadErrorMessage = error
    ? localizeErrorMessage(error, dictionary, t.loadError)
    : t.loadError;

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>{t.filtersTitle}</CardTitle>
          <CardDescription>{t.filtersDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="w-full md:w-64">
              <Select
                value={actionFilter}
                onValueChange={(nextValue) => {
                  setActionFilter(nextValue);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.actionPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ACTIONS}>{t.allActions}</SelectItem>
                  {Object.values(AuditAction).map((action) => (
                    <SelectItem key={action} value={action}>
                      {getActionLabel(action, dictionary)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {t.refresh}
            </Button>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {t.searchHint ?? 'Search filters current page only.'}
          </p>
        </CardContent>
      </Card>

      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>{t.activityTitle}</CardTitle>
          <CardDescription>
            {t.activityDescription
              .replace('{shown}', String(filteredLogs.length))
              .replace('{pageCount}', String(logs.length))
              .replace('{total}', String(totalItems))}
            {search.trim() ? ` ${t.searchApplied}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-3">
              <p className="text-destructive text-sm">{loadErrorMessage}</p>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                {dictionary.common.retry}
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              {t.noResults}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.columns.action}</TableHead>
                      <TableHead>{t.columns.user}</TableHead>
                      <TableHead>{t.columns.role}</TableHead>
                      <TableHead>{t.columns.target}</TableHead>
                      <TableHead>{t.columns.ip}</TableHead>
                      <TableHead className={dateColumnClass}>
                        {t.columns.date}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={getActionVariant(log.action)}>
                            {getActionLabel(log.action, dictionary)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.userEmail}</span>
                            <span className="text-muted-foreground text-xs">
                              {log.userId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{log.userRole}</TableCell>
                        <TableCell>
                          {log.target ?? dictionary.common.na}
                        </TableCell>
                        <TableCell>
                          {log.ipAddress ?? dictionary.common.na}
                        </TableCell>
                        <TableCell
                          className={dateColumnClass}
                          dir={isArabic ? 'rtl' : 'ltr'}
                        >
                          {formatAuditDate(log, lang)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  {t.previous}
                </Button>
                <span className="text-muted-foreground text-sm">
                  {t.pageLabel
                    .replace('{page}', String(page))
                    .replace('{totalPages}', String(Math.max(1, totalPages)))}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages || isFetching}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  {t.next}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
