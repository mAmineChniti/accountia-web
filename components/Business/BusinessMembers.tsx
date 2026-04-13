'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Mail, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { BusinessService } from '@/lib/requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import type { ClientData } from '@/types/services';

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-green-100 text-green-700',
  CLIENT: 'bg-gray-100 text-gray-700',
};

const InviteSchema = z.object({
  invitedEmail: z.string().email('Valid email required'),
  businessRole: z.enum(['ADMIN', 'MEMBER']),
});
type InviteInput = z.infer<typeof InviteSchema>;

export function BusinessMembers({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['business-clients', businessId],
    queryFn: () => BusinessService.getBusinessClients(businessId),
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { businessRole: 'MEMBER' },
  });

  const inviteMutation = useMutation({
    mutationFn: (values: InviteInput) =>
      BusinessService.inviteBusinessUser(businessId, {
        ...values,
        businessId,
      }),
    onSuccess: (data) => {
      toast.success(data.message ?? 'Invitation sent successfully');
      reset();
      setIsInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['business-clients', businessId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to send invitation'),
  });

  const members: ClientData[] = data?.clients ?? [];

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load members</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">Manage who has access to this business</p>
        </div>
        <Button className="gap-2" onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card className="border-0 bg-white/90 shadow-sm dark:bg-card/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            {isLoading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Users className="text-muted-foreground h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">No members yet</p>
              <p className="text-muted-foreground text-sm">
                Invite team members to collaborate on this business
              </p>
              <Button variant="outline" className="gap-2 mt-2" onClick={() => setIsInviteOpen(true)}>
                <UserPlus className="h-4 w-4" /> Send First Invite
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="border-border/30 hover:bg-primary/5">
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {member.phoneNumber ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a Team Member</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((values) => inviteMutation.mutate(values))}
            className="space-y-4 pt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="invitedEmail">Email address</Label>
              <Input
                id="invitedEmail"
                type="email"
                placeholder="colleague@example.com"
                {...register('invitedEmail')}
              />
              {errors.invitedEmail && (
                <p className="text-destructive text-sm">{errors.invitedEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                defaultValue="MEMBER"
                onValueChange={(v) => setValue('businessRole', v as 'ADMIN' | 'MEMBER')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">
                    <div className="flex flex-col">
                      <span className="font-medium">Admin</span>
                      <span className="text-muted-foreground text-xs">
                        Can manage invoices, expenses, vendors — cannot approve POs
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MEMBER">
                    <div className="flex flex-col">
                      <span className="font-medium">Member</span>
                      <span className="text-muted-foreground text-xs">
                        Can create expenses and POs — cannot approve or manage settings
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.businessRole && (
                <p className="text-destructive text-sm">{errors.businessRole.message}</p>
              )}
            </div>

            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              If the user already has an account they will be added immediately.
              Otherwise an invitation email will be sent.
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={inviteMutation.isPending} className="gap-2">
                {inviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
