'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import {
  InviteTeamMemberSchema,
  type InviteTeamMemberInput,
} from '@/types/RequestSchemas';
import { BusinessService } from '@/lib/requests';
import { localizeErrorMessage } from '@/lib/error-localization';
import type { Dictionary } from '@/get-dictionary';
import type { Locale } from '@/i18n-config';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  dictionary: Dictionary;
  lang: Locale;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  businessId,
  dictionary,
  lang,
}: InviteMemberModalProps) {
  const queryClient = useQueryClient();
  const t = {
    inviteMember: 'Invite Member',
    inviteMemberDescription: 'Send an invitation email to a new team member.',
    emailLabel: 'Email Address',
    roleLabel: 'Role',
    cancel: 'Cancel',
    sendInvite: 'Send Invitation',
    successTitle: 'Invitation sent',
  };

  const form = useForm<InviteTeamMemberInput>({
    resolver: zodResolver(InviteTeamMemberSchema),
    defaultValues: {
      email: '',
      role: 'BUSINESS_ADMIN',
    },
  });

  const { mutate: inviteMember, isPending } = useMutation({
    mutationFn: (data: InviteTeamMemberInput) =>
      BusinessService.inviteTeamMember(businessId, { ...data, lang }),
    onSuccess: () => {
      toast.success(t.successTitle || 'Invitation sent successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', businessId] });
      form.reset();
      onClose();
    },
    onError: (error: unknown) => {
      const errorMessage = localizeErrorMessage(
        error,
        dictionary,
        'Failed to invite team member'
      );
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: InviteTeamMemberInput) => {
    inviteMember(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t.inviteMember}
          </DialogTitle>
          <DialogDescription>{t.inviteMemberDescription}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.emailLabel}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.roleLabel}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">Business Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                {t.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.sendInvite}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
