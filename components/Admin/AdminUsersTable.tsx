'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import type {
  UserSummary,
  UsersListResponse,
} from '@/types/ResponseInterfaces';
import { AuthService } from '@/lib/requests';

import type { Dictionary } from '@/get-dictionary';

export default function AdminUsersTable({
  dictionary,
}: {
  dictionary: Dictionary;
}) {
  const queryClient = useQueryClient();
  const [modalUser, setModalUser] = useState<UserSummary | undefined>();
  const [deleteError, setDeleteError] = useState<string | undefined>();

  const { data, isLoading, error } = useQuery<UsersListResponse>({
    queryKey: ['users'],
    queryFn: AuthService.fetchAllUsers,
  });

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
    onError: (err: unknown) => {
      setDeleteError(
        (err as { message?: string })?.message || 'Failed to delete user'
      );
    },
  });

  return (
    <div>
      {error && (
        <div className="mb-4 text-red-600">{dictionary.common.error}</div>
      )}
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Table>
          <TableCaption>
            {dictionary.admin?.tableCaption || 'List of all users'}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary.admin?.username || 'Username'}</TableHead>
              <TableHead>{dictionary.admin?.email || 'Email'}</TableHead>
              <TableHead>
                {dictionary.admin?.firstName || 'First Name'}
              </TableHead>
              <TableHead>{dictionary.admin?.lastName || 'Last Name'}</TableHead>
              <TableHead>{dictionary.admin?.isAdmin || 'Admin'}</TableHead>
              <TableHead>
                {dictionary.admin?.dateJoined || 'Date Joined'}
              </TableHead>
              <TableHead>{dictionary.admin?.actions || 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users && data.users.length > 0 ? (
              data.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.firstName || '-'}</TableCell>
                  <TableCell>{user.lastName || '-'}</TableCell>
                  <TableCell>
                    {user.isAdmin
                      ? dictionary.common.yes
                      : dictionary.common.no}
                  </TableCell>
                  <TableCell>
                    {user.dateJoined
                      ? new Date(user.dateJoined).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Dialog
                      open={modalUser?.id === user.id}
                      onOpenChange={(open) => {
                        setModalUser(open ? user : undefined);
                        setDeleteError(undefined);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setModalUser(user)}
                          disabled={deleteMutation.isPending}
                        >
                          {dictionary.common.delete}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {dictionary.admin?.confirmDeleteTitle ||
                              'Confirm Deletion'}
                          </DialogTitle>
                          <DialogDescription>
                            {dictionary.admin?.confirmDeleteDescription?.replace(
                              '{username}',
                              user.username
                            ) ||
                              `Are you sure you want to delete user ${user.username}? This action cannot be undone.`}
                          </DialogDescription>
                        </DialogHeader>
                        {deleteError && (
                          <div className="mb-2 text-red-600">{deleteError}</div>
                        )}
                        <DialogFooter showCloseButton>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(user.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending
                              ? dictionary.common.loading
                              : dictionary.common.delete}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  {dictionary.admin?.noUsers || 'No users found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
