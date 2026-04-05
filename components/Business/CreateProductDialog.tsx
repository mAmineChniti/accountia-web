'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { type Dictionary } from '@/get-dictionary';
import { CreateProductSchema } from '@/types/RequestSchemas';
import type { CreateProductInput } from '@/types/RequestSchemas';
import { ProductsService } from '@/lib/requests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CreateProductDialogProps {
  businessId: string;
  dictionary: Dictionary;
  trigger?: React.ReactNode;
}

export function CreateProductDialog({
  businessId,
  dictionary,
  trigger,
}: CreateProductDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = dictionary.pages.businessProducts;

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      businessId,
      name: '',
      description: '',
      unitPrice: 0,
      cost: 0,
      quantity: 1,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateProductInput) =>
      ProductsService.createProduct(data, businessId),
    onSuccess: () => {
      toast.success(t.createSuccess);
      queryClient.invalidateQueries({
        queryKey: ['business-products', businessId],
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: unknown) => {
      const err = error as Error;
      toast.error(err.message || t.createError);
    },
  });

  function onSubmit(data: CreateProductInput) {
    mutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t.addProduct}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t.addProduct}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.productNameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.productNamePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.descriptionLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t.descriptionPlaceholder}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.unitPriceLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="border-orange-200 bg-orange-50/10 transition-all focus-visible:ring-orange-400"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.costPriceLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="border-red-400/50 bg-red-50/10 shadow-[0_0_10px_rgba(239,68,68,0.05)] transition-all focus-visible:ring-red-400"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.initialQuantityLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                {dictionary.common.cancel}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mutation.isPending ? t.submitting : t.addProduct}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
