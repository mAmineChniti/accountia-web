'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Search, Trash2, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { BusinessService } from '@/lib/requests';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { localizeErrorMessage } from '@/lib/error-localization';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

import { InviteMemberModal } from './InviteMemberModal';
import type { TeamMember } from '@/types/ResponseInterfaces';

export function TeamList({
  businessId,
  dictionary,
  lang,
}: {
  businessId: string;
  dictionary: Dictionary;
  lang: Locale;
}) {
  const queryClient = useQueryClient();
  const businessText = dictionary.pages.business;
  const t = {
    title: businessText.team || 'Team Management',
    description:
      businessText.clientsDescription ||
      'Manage your business team members and their roles.',
    inviteButton: 'Invite Member',
    searchPlaceholder: 'Search members...',
    columns: {
      name: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      actions: 'Actions',
    },
    removeConfirmTitle: 'Remove Team Member',
    removeConfirmDescription:
      'Are you sure you want to remove this member? They will lose access to the business immediately.',
    cancel: 'Cancel',
    remove: 'Remove',
  };

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<
    TeamMember | undefined
  >();

  const { data: response, isLoading } = useQuery({
    queryKey: ['team-members', businessId],
    queryFn: () => BusinessService.getTeamMembers(businessId),
  });

  const members = response?.members || [];

  const filteredMembers = members.filter(
    (m) =>
      (m.firstName + ' ' + m.lastName)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { mutate: removeMember, isPending: isRemoving } = useMutation({
    mutationFn: (member: TeamMember) => {
      // If pending, cancel invite. If accepted, unassign user.
      if (member.status === 'PENDING') {
        return BusinessService.cancelInvite(businessId, member.id);
      }
      return BusinessService.unassignUser(
        businessId,
        member.userId ?? member.id
      );
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', businessId] });
      setMemberToRemove(undefined);
    },
    onError: (error: unknown) => {
      const errorMessage = localizeErrorMessage(
        error,
        dictionary,
        'Failed to remove member'
      );
      toast.error(errorMessage);
    },
  });

  const getStatusBadge = (status: TeamMember['status']) => {
    switch (status) {
      case 'ACCEPTED': {
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Active
          </Badge>
        );
      }
      case 'PENDING': {
        return (
          <Badge
            variant="outline"
            className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
          >
            Pending
          </Badge>
        );
      }
      case 'EXPIRED': {
        return <Badge variant="destructive">Expired</Badge>;
      }
      default: {
        return <Badge variant="secondary">{status}</Badge>;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.title}</h2>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Button
          onClick={() => setIsInviteModalOpen(true)}
          className="shrink-0 gap-2"
        >
          <Mail className="h-4 w-4" />
          {t.inviteButton}
        </Button>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder={t.searchPlaceholder}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.columns.name}</TableHead>
                <TableHead>{t.columns.email}</TableHead>
                <TableHead>{t.columns.role}</TableHead>
                <TableHead>{t.columns.status}</TableHead>
                <TableHead className="w-[100px] text-right">
                  {t.columns.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground h-32 text-center"
                  >
                    No members found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.firstName || member.lastName
                        ? `${member.firstName || ''} ${member.lastName || ''}`
                        : '-'}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-blue-500" />
                        <span className="capitalize">
                          {member.role.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(member)}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        businessId={businessId}
        dictionary={dictionary}
        lang={lang}
      />

      {/* Remove Member Confirmation */}
      <Dialog
        open={memberToRemove !== undefined}
        onOpenChange={(open) => !open && setMemberToRemove(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {t.removeConfirmTitle}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t.removeConfirmDescription} <br />
              <strong>{memberToRemove?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setMemberToRemove(undefined)}
              disabled={isRemoving}
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => memberToRemove && removeMember(memberToRemove)}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : t.remove}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
