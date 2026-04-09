'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { type Dictionary } from '@/get-dictionary';
import { UpdateProductSchema } from '@/types/services';
import type { UpdateProductInput } from '@/types/services';
import { ProductsService } from '@/lib/requests';
import { type Product } from '@/types/services';
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

interface EditProductDialogProps {
  businessId: string;
  product: Product;
  dictionary: Dictionary;
  trigger?: React.ReactNode;
}

export function EditProductDialog({
  businessId,
  product,
  dictionary,
  trigger,
}: EditProductDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = dictionary.pages.businessProducts;

  const form = useForm<UpdateProductInput>({
    resolver: zodResolver(UpdateProductSchema),
    defaultValues: {
      businessId,
      name: product.name,
      description: product.description,
      unitPrice: product.unitPrice,
      cost: product.cost,
      quantity: product.quantity,
    },
  });

  // Update form values when dialog opens or product ID changes
  useEffect(() => {
    if (open) {
      form.reset({
        businessId,
        name: product.name,
        description: product.description,
        unitPrice: product.unitPrice,
        cost: product.cost,
        quantity: product.quantity,
      });
    }
  }, [
    open,
    product.id,
    product.name,
    product.description,
    product.unitPrice,
    product.cost,
    product.quantity,
    form,
    businessId,
  ]);

  const mutation = useMutation({
    mutationFn: (data: UpdateProductInput) =>
      ProductsService.updateProduct(product.id, data),
    onSuccess: () => {
      toast.success(t.updateSuccess || 'Product updated successfully');
      // Invalidate all product queries for this business to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['business-products', businessId || product.businessId],
      });
      // Also invalidate products query used in invoice creation
      queryClient.invalidateQueries({
        queryKey: ['products', businessId || product.businessId],
      });
      if (!businessId) {
        queryClient.invalidateQueries({ queryKey: ['business-products', ''] });
        queryClient.invalidateQueries({ queryKey: ['products', ''] });
      }
      setOpen(false);
    },
    onError: (error: unknown) => {
      const err = error as Error;
      toast.error(err.message || t.updateError || 'Failed to update product');
    },
  });

  function onSubmit(data: UpdateProductInput) {
    mutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 px-2"
          >
            <Edit className="h-4 w-4" />
            {t.editProduct || 'Edit Product'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t.editProduct || 'Edit Product'}</DialogTitle>
          <DialogDescription>
            {t.editDescription || 'Update product details below'}
          </DialogDescription>
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
                    <FormLabel>{t.unitPriceLabel} (TND)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="border-orange-200 bg-orange-50/10 transition-all focus-visible:ring-orange-400"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={(e) => {
                          const numValue =
                            Number.parseFloat(e.target.value) || 0;
                          field.onChange(numValue);
                        }}
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
                    <FormLabel>{t.costPriceLabel} (TND)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="border-red-400/50 bg-red-50/10 shadow-[0_0_10px_rgba(239,68,68,0.05)] transition-all focus-visible:ring-red-400"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={(e) => {
                          const numValue =
                            Number.parseFloat(e.target.value) || 0;
                          field.onChange(numValue);
                        }}
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
                        value={field.value ?? 0}
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
                {mutation.isPending
                  ? t.updating || 'Updating...'
                  : t.saveChanges || 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
