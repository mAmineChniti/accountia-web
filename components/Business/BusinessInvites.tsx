'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { BusinessService } from '@/lib/requests';
import type { Dictionary } from '@/get-dictionary';
import type {
  BusinessInvite,
  BusinessInvitesListResponse,
  InviteBusinessUserInput,
} from '@/types/services';

const inviteFormSchema = z.object({
  invitedEmail: z.email('Please enter a valid email address'),
  businessRole: z.string().min(1, 'Please choose a role'),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

type BusinessInvitesProps = {
  businessId: string;
  dictionary: Dictionary;
};

const roleOptions = [
  { value: 'ADMIN', label: 'Admin/Member' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'CLIENT', label: 'Client' },
];

const canResendInvite = (invite: BusinessInvite) =>
  invite.status !== 'accepted' && invite.status !== 'revoked';

export default function BusinessInvites({
  businessId,
  dictionary,
}: BusinessInvitesProps) {
  const t = dictionary.pages.business.invites;
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<
    InviteFormValues | undefined
  >();
  const [resendInviteId, setResendInviteId] = useState<string | undefined>();

  const { data, isPending, isError, refetch } =
    useQuery<BusinessInvitesListResponse>({
      queryKey: ['business-invites', businessId],
      queryFn: () => BusinessService.getBusinessInvites(businessId),
      staleTime: 5 * 60 * 1000,
      retry: false,
    });

  const inviteMutation = useMutation({
    mutationFn: (values: InviteFormValues) =>
      BusinessService.inviteBusinessUser(
        businessId,
        values as InviteBusinessUserInput
      ),
    onSuccess: () => {
      toast.success(t.inviteSentSuccess);
      form.reset({ invitedEmail: '', businessRole: 'CLIENT' });
      setConfirmOpen(false);
      queryClient.invalidateQueries({
        queryKey: ['business-invites', businessId],
      });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t.inviteSendError);
    },
  });

  const resendMutation = useMutation({
    mutationFn: (inviteId: string) =>
      BusinessService.resendInvite({ businessId, inviteId }),
    onMutate: (inviteId) => {
      setResendInviteId(inviteId);
    },
    onSuccess: () => {
      toast.success(t.inviteResentSuccess);
      queryClient.invalidateQueries({
        queryKey: ['business-invites', businessId],
      });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t.inviteResendError);
    },
    onSettled: () => {
      setResendInviteId(undefined);
    },
  });

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      invitedEmail: '',
      businessRole: 'CLIENT',
    },
    mode: 'onTouched',
  });

  const onSubmit = (values: InviteFormValues) => {
    setPendingInvite(values);
    setConfirmOpen(true);
  };

  const handleConfirmSend = () => {
    if (!pendingInvite) {
      return;
    }
    inviteMutation.mutate(pendingInvite);
  };

  const invites = data?.invites ?? [];

  const getInviteStatus = (invite: BusinessInvite) => {
    if (invite.status) {
      return invite.status === 'pending'
        ? t.pendingLabel
        : invite.status === 'accepted'
          ? t.acceptedLabel
          : t.revokedLabel;
    }
    return invite.emailSent ? t.sentLabel : t.notSentLabel;
  };

  return (
    <Card
      id="business-invites"
      className="dark:bg-card/90 border-0 bg-white/90 shadow-sm"
    >
      <CardHeader>
        <CardTitle>{t.sectionTitle}</CardTitle>
        <CardDescription>{t.sectionDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="invitedEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.emailLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t.emailPlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.roleLabel}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t.rolePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted-foreground space-y-1 text-sm">
                <p>{t.inviteHint}</p>
              </div>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : undefined}
                {t.sendInviteButton}
              </Button>
            </div>
          </form>
        </Form>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t.confirmDialogTitle}</DialogTitle>
              <DialogDescription>
                {t.confirmDialogDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="text-muted-foreground space-y-3 py-2 text-sm">
              <p>
                <strong>{t.emailLabel}:</strong> {pendingInvite?.invitedEmail}
              </p>
              <p>
                <strong>{t.roleLabel}:</strong>{' '}
                {roleOptions.find(
                  (option) => option.value === pendingInvite?.businessRole
                )?.label ?? pendingInvite?.businessRole}
              </p>
            </div>
            <DialogFooter className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                {t.cancelButton}
              </Button>
              <Button
                onClick={handleConfirmSend}
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : undefined}
                {t.confirmSendButton}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-sm font-semibold">
                {t.listTitle}
              </p>
              <p className="text-muted-foreground text-sm">
                {t.listDescription}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              {t.refreshButton}
            </Button>
          </div>

          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="border-border bg-muted/70 text-destructive rounded-lg border p-4 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t.listLoadError}
              </div>
            </div>
          ) : invites.length === 0 ? (
            <div className="border-border text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
              {t.noInvites}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.emailLabel}</TableHead>
                    <TableHead>{t.roleLabel}</TableHead>
                    <TableHead>{t.statusLabel}</TableHead>
                    <TableHead>{t.sentLabel}</TableHead>
                    <TableHead>{t.createdLabel}</TableHead>
                    <TableHead>{t.actionsLabel}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.invitedEmail}</TableCell>
                      <TableCell>{invite.businessRole}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getInviteStatus(invite)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invite.emailSent ? t.yesLabel : t.noLabel}
                      </TableCell>
                      <TableCell>
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            !canResendInvite(invite) || resendMutation.isPending
                          }
                          onClick={() => resendMutation.mutate(invite.id)}
                        >
                          {resendInviteId === invite.id &&
                          resendMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          {t.resendButton}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
