/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Users, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { BusinessService } from '@/lib/requests';

interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: string;
}

interface CreateClientFormData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password: string;
}

interface Props {
  businessId: string;
}

export default function ClientManagement({ businessId }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientFormData>();

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients', businessId],
    queryFn: () => BusinessService.getClients(businessId),
    enabled: !!businessId,
  });

  const createClientMutation = useMutation({
    mutationFn: (data: CreateClientFormData) =>
      BusinessService.createClient(businessId, data),
    onSuccess: () => {
      toast.success('Client created successfully!');
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create client');
    },
  });

  const onSubmit = (data: CreateClientFormData) => {
    createClientMutation.mutate(data);
  };

  const clients: Client[] = clientsData?.users || [];

  return (
    <div className="bg-background min-h-screen p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Client Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your business clients
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Users className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Clients</p>
              <p className="text-2xl font-bold">{clients.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clients List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="text-muted-foreground mb-4 h-16 w-16 opacity-30" />
          <h3 className="text-foreground mb-2 text-xl font-semibold">
            No clients yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Add your first client to get started
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Your First Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-card rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
                  {(client.firstName?.[0] ?? 'C').toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">
                    {client.firstName} {client.lastName}
                  </p>
                  <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
                    Client
                  </span>
                </div>
              </div>
              <div className="text-muted-foreground space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{client.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Create New Client
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register('firstName', { required: 'Required' })}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-destructive text-xs">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register('lastName', { required: 'Required' })}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-destructive text-xs">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                })}
                placeholder="client@example.com"
              />
              {errors.email && (
                <p className="text-destructive text-xs">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                {...register('phoneNumber')}
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Required',
                  minLength: { value: 8, message: 'Min 8 characters' },
                })}
                placeholder="At least 8 characters"
              />
              {errors.password && (
                <p className="text-destructive text-xs">
                  {errors.password.message}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createClientMutation.isPending}>
                {createClientMutation.isPending
                  ? 'Creating...'
                  : 'Create Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
