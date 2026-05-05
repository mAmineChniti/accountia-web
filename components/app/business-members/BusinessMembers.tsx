'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Crown,
  Mail,
  ShieldCheck,
  UserCircle2,
  UserPlus,
  Users,
} from 'lucide-react';

import { BusinessService } from '@/lib/requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TeamMember, TeamMemberRole } from '@/types/services';
import { type Dictionary } from '@/get-dictionary';

// Hierarchy order — owners first, clients last
const ROLE_ORDER: TeamMemberRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'CLIENT'];

export function BusinessMembers({
  businessId,
  dictionary,
}: {
  businessId: string;
  dictionary: Dictionary;
}) {
  const t = dictionary.pages.businessMembers;
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? 'en';
  const invitesHref = `/${lang}/business/${businessId}/invites`;

  const { data: businessesData } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: () => BusinessService.getMyBusinesses(),
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['business-team', businessId],
    queryFn: () => BusinessService.getTeamMembers(businessId),
    staleTime: 5 * 60 * 1000,
  });

  const members = useMemo(() => data?.members ?? [], [data]);

  const currentRole = useMemo(() => {
    const match = businessesData?.businesses?.find((b) => b.id === businessId);
    return (match?.role ?? '').toUpperCase() as TeamMemberRole | '';
  }, [businessesData, businessId]);

  const canManage = currentRole === 'OWNER' || currentRole === 'ADMIN';
  const roleMeta: Record<
    TeamMemberRole,
    { label: string; badge: string; icon: typeof Crown }
  > = {
    OWNER: {
      label: t.owners,
      badge:
        'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      icon: Crown,
    },
    ADMIN: {
      label: t.admins,
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      icon: ShieldCheck,
    },
    MEMBER: {
      label: t.members,
      badge:
        'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      icon: Users,
    },
    CLIENT: {
      label: t.clients,
      badge:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      icon: UserCircle2,
    },
  };

  const grouped = useMemo(() => {
    const map = new Map<TeamMemberRole, TeamMember[]>();
    for (const role of ROLE_ORDER) map.set(role, []);
    for (const m of members) {
      const role = (
        ROLE_ORDER.includes(m.role) ? m.role : 'MEMBER'
      ) as TeamMemberRole;
      map.get(role)!.push(m);
    }
    return map;
  }, [members]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <span>{t.failedLoad}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        {canManage && (
          <Button asChild className="gap-2">
            <Link href={invitesHref}>
              <UserPlus className="h-4 w-4" />
              {t.inviteMember}
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="text-muted-foreground h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">{t.noMembers}</p>
            {canManage && (
              <Button asChild variant="outline" className="mt-2 gap-2">
                <Link href={invitesHref}>
                  <UserPlus className="h-4 w-4" /> {t.sendFirstInvite}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        ROLE_ORDER.map((role) => {
          const list = grouped.get(role) ?? [];
          if (list.length === 0) return;
          const meta = roleMeta[role];
          const Icon = meta.icon;
          return (
            <Card
              key={role}
              className="dark:bg-card/90 border-0 bg-white/90 shadow-sm"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4" />
                  {meta.label}
                  <Badge variant="secondary" className={meta.badge}>
                    {list.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="font-semibold">{t.name}</TableHead>
                      <TableHead className="font-semibold">{t.email}</TableHead>
                      <TableHead className="font-semibold">{t.phone}</TableHead>
                      <TableHead className="font-semibold">
                        {t.joined}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((m) => (
                      <TableRow
                        key={m.id}
                        className="border-border/30 hover:bg-primary/5"
                      >
                        <TableCell className="font-medium">
                          {m.firstName} {m.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {m.email}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {m.phoneNumber ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
