'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Trash2,
  Plus,
  Check,
  Upload,
  ArrowLeft,
  CalendarIcon,
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import {
  CreateInvoiceSchema,
  type CreateInvoiceInput,
  INVOICE_RECIPIENT_TYPES,
} from '@/types/RequestSchemas';
import { InvoicesService, ProductsService } from '@/lib/requests';
import { localizeErrorMessage } from '@/lib/error-localization';
import type { ProductListResponse } from '@/types/ResponseInterfaces';
import { ImportInvoicesModal } from '../Invoices/ImportInvoicesModal';

interface CreateBusinessInvoicePageProps {
  businessId: string;
  dictionary: Dictionary;
  lang: Locale;
}

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'TND'];

export function CreateBusinessInvoicePage({
  businessId,
  dictionary,
  lang,
}: CreateBusinessInvoicePageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = dictionary.pages.invoices;
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch products for this business
  const { data: productsData, isLoading: isLoadingProducts } =
    useQuery<ProductListResponse>({
      queryKey: ['products', businessId],
      queryFn: () => ProductsService.getProducts(1, 100, businessId),
      staleTime: 15 * 60 * 1000, // 15 minutes - products change infrequently
      gcTime: 60 * 60 * 1000, // 1 hour - keep products cached longer
    });

  const products = productsData?.products ?? [];

  // Create invoice mutation
  const { mutate: createInvoice, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateInvoiceInput) =>
      InvoicesService.createInvoice(data),
    onSuccess: () => {
      toast.success(t.successMessage || 'Invoice created successfully');
      // Invalidate invoice queries to refetch updated list
      queryClient.invalidateQueries({ queryKey: ['invoices-issued'] });
      router.push(`/${lang}/business/${businessId}/invoices`);
    },
    onError: (error: unknown) => {
      const errorMessage = localizeErrorMessage(
        error,
        dictionary,
        t.fetchError
      );
      toast.error(errorMessage);
    },
  });

  // Form setup
  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(CreateInvoiceSchema),
    defaultValues: {
      businessId,
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      currency: 'TND',
      description: '',
      paymentTerms: '',
      recipient: {
        type: INVOICE_RECIPIENT_TYPES.EXTERNAL,
        platformId: '',
        displayName: '',
        email: '',
      },
      lineItems: [
        {
          productId: '',
          productName: '',
          quantity: 1,
          unitPrice: 0,
          description: '',
        },
      ],
    },
  });

  // Watch recipient type to conditionally render fields

  // eslint-disable-next-line react-hooks/incompatible-library
  const recipientType = form.watch('recipient.type');

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  // Calculate total

  const lineItems = form.watch('lineItems');
  const total = lineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice || 0);
  }, 0);

  const handleAddLineItem = () => {
    append({
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      description: '',
    });
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setValue(`lineItems.${index}.productId`, productId);
      form.setValue(`lineItems.${index}.productName`, product.name);
      form.setValue(`lineItems.${index}.unitPrice`, product.unitPrice);
      if (!form.getValues(`lineItems.${index}.description`)) {
        form.setValue(`lineItems.${index}.description`, product.description);
      }
    }
  };

  const onSubmit = (data: CreateInvoiceInput) => {
    console.log('Submitting invoice data:', data);
    createInvoice(data);
  };

  const onError = () => {
    toast.error(t.fetchError || 'Please check the form for errors');
  };

  return (
    <div className="space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.createInvoiceButton || 'Create Invoice'}
            </h1>
          </div>
          <p className="text-muted-foreground ml-11">
            {t.createInvoiceDescription ||
              'Fill in the details below to create a new invoice'}
          </p>
        </div>
      </div>

      {/* Import Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsImportModalOpen(true)}
          disabled={isMounted && isCreating}
        >
          <Upload className="mr-2 h-4 w-4" />
          {t.importInvoices || 'Import from File'}
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          className="space-y-6"
        >
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t.basicInformation || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="issuedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.columnIssuedDate}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(new Date(field.value), 'PPP')
                                : 'Pick a date'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(field.value)}
                            onSelect={(date) =>
                              field.onChange(
                                date?.toISOString().split('T')[0] || ''
                              )
                            }
                            disabled={(date) => date > new Date('2100-01-01')}
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.columnDueDate}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(new Date(field.value), 'PPP')
                                : 'Pick a date'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(field.value)}
                            onSelect={(date) =>
                              field.onChange(
                                date?.toISOString().split('T')[0] || ''
                              )
                            }
                            disabled={(date) => date > new Date('2100-01-01')}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.currencyLabel || 'Currency'}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.descriptionLabel || 'Description'} (
                      {t.optional || 'Optional'})
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Invoice description or notes..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.paymentTermsLabel || 'Payment Terms'} (
                      {t.optional || 'Optional'})
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Net 30, Due on receipt, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Recipient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t.recipientInformation || 'Recipient Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="recipient.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.recipientTypeLabel || 'Recipient Type'}
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={INVOICE_RECIPIENT_TYPES.EXTERNAL}>
                          {t.externalContactLabel || 'External Contact'}
                        </SelectItem>
                        <SelectItem
                          value={INVOICE_RECIPIENT_TYPES.PLATFORM_BUSINESS}
                        >
                          {t.platformBusinessLabel || 'Platform Business'}
                        </SelectItem>
                        <SelectItem
                          value={INVOICE_RECIPIENT_TYPES.PLATFORM_INDIVIDUAL}
                        >
                          {t.platformIndividualLabel || 'Platform Individual'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email field - required for all recipient types */}
              <FormField
                control={form.control}
                name="recipient.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.recipientEmailLabel || 'Email'} *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    {recipientType ===
                      INVOICE_RECIPIENT_TYPES.PLATFORM_BUSINESS && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t.autoSearchBusinessHint ||
                          'System will auto-search for a registered business with this email'}
                      </p>
                    )}
                    {recipientType ===
                      INVOICE_RECIPIENT_TYPES.PLATFORM_INDIVIDUAL && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t.autoSearchIndividualHint ||
                          'System will auto-search for a registered user with this email'}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display name - required for external recipients */}
              {recipientType === INVOICE_RECIPIENT_TYPES.EXTERNAL && (
                <FormField
                  control={form.control}
                  name="recipient.displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.recipientNameLabel || 'Name'} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe or Company Name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {t.lineItemsLabel || 'Line Items'}
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  disabled={isMounted && isCreating}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addLineItemButton || 'Add Item'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingProducts ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {fields.map((field, index) => (
                    <Card key={field.id} className="bg-muted/30 p-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4">
                          {/* Product Select */}
                          <div className="col-span-6">
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.productId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t.productLabel || 'Product'}
                                  </FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={(value) =>
                                      handleProductSelect(index, value)
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select product" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {products.map((product) => (
                                        <SelectItem
                                          key={product.id}
                                          value={product.id}
                                        >
                                          {product.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Quantity */}
                          <div className="col-span-3">
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t.quantityLabel || 'Qty'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      step="1"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          Number.parseFloat(e.target.value) || 0
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Unit Price - Read Only */}
                          <div className="col-span-3">
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t.unitPriceLabel || 'Price'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      disabled
                                      className="bg-muted cursor-not-allowed"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t.descriptionLabel || 'Description'} (
                                {t.optional || 'Optional'})
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Item description..."
                                  rows={2}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Remove Button */}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={
                              isMounted && (fields.length === 1 || isCreating)
                            }
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t.removeLabel || 'Remove'}
                          </Button>
                        </div>

                        {/* Line Item Total */}
                        <div className="border-t pt-4 text-right">
                          <p className="text-muted-foreground text-sm">
                            Subtotal:{' '}
                            {(
                              (lineItems[index]?.quantity || 0) *
                              (lineItems[index]?.unitPrice || 0)
                            ).toLocaleString(lang, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            {form.getValues('currency')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Section */}
          <Card className="border-primary/20 bg-primary/5 border-2">
            <CardContent className="pt-6">
              <div className="flex items-baseline justify-between text-xl font-bold">
                <span>{t.totalLabel || 'Total'}</span>
                <span>
                  {total.toLocaleString(lang, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {form.getValues('currency')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isMounted && isCreating}
              className="flex-1"
            >
              {t.cancelLabel || 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isMounted && (isCreating || isLoadingProducts)}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.creatingLabel || 'Creating...'}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t.createLabel || 'Create'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Import Invoices Modal */}
      <ImportInvoicesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() =>
          router.push(`/${lang}/business/${businessId}/invoices`)
        }
        dictionary={dictionary}
        _lang={lang}
      />
    </div>
  );
}
