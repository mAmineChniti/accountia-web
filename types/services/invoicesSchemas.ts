import { z } from 'zod';

export const INVOICE_RECIPIENT_TYPES = {
  EXTERNAL: 'EXTERNAL',
  PLATFORM_BUSINESS: 'PLATFORM_BUSINESS',
  PLATFORM_INDIVIDUAL: 'PLATFORM_INDIVIDUAL',
} as const;

const DateSchema = z.iso.date({ error: 'Invalid ISO date' });

const OptionalDateSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.iso.date({ error: 'Invalid ISO date' }).optional()
);

const InvoiceStatusEnum = z.enum([
  'DRAFT',
  'ISSUED',
  'VIEWED',
  'PAID',
  'PARTIAL',
  'OVERDUE',
  'DISPUTED',
  'VOIDED',
  'ARCHIVED',
]);

const ExternalRecipientSchema = z.object({
  type: z.literal(INVOICE_RECIPIENT_TYPES.EXTERNAL),
  email: z.email('Valid email is required'),
  displayName: z
    .string()
    .min(1, 'Display name is required for external recipients'),
  platformId: z.string().optional(),
});

const PlatformRecipientSchema = z.object({
  type: z.enum([
    INVOICE_RECIPIENT_TYPES.PLATFORM_BUSINESS,
    INVOICE_RECIPIENT_TYPES.PLATFORM_INDIVIDUAL,
  ]),
  email: z.email('Valid email is required for magic search'),
  platformId: z.string().min(1).optional(),
  displayName: z.string().optional(),
});

export const CreateInvoiceRecipientSchema = z.union([
  ExternalRecipientSchema,
  PlatformRecipientSchema,
]);

export const CreateInvoiceLineItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  description: z.string().optional(),
});

export const CreateInvoiceSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  issuedDate: DateSchema,
  dueDate: DateSchema,
  currency: z.string().min(1, 'Currency is required'),
  description: z.string().optional(),
  paymentTerms: z.string().optional(),
  recipient: CreateInvoiceRecipientSchema,
  lineItems: z
    .array(CreateInvoiceLineItemSchema)
    .min(1, 'At least one line item is required'),
});

export const UpdateInvoiceSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  description: z.string().optional(),
  paymentTerms: z.string().optional(),
  dueDate: OptionalDateSchema,
});

export const TransitionInvoiceSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  newStatus: InvoiceStatusEnum,
  amountPaid: z.number().min(0).optional(),
  reason: z.string().optional(),
});

export type CreateInvoiceRecipientInput = z.infer<
  typeof CreateInvoiceRecipientSchema
>;
export type CreateInvoiceLineItemInput = z.infer<
  typeof CreateInvoiceLineItemSchema
>;
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type TransitionInvoiceInput = z.infer<typeof TransitionInvoiceSchema>;

export const CreateInvoiceCheckoutSessionSchema = z.object({
  successUrl: z.url().optional(),
  cancelUrl: z.url().optional(),
});

export const MockInvoicePaymentSchema = z.object({
  cardholderName: z.string().min(2, 'Cardholder name is required'),
  cardNumber: z.string().min(12, 'Card number is required'),
  expiry: z.string().min(4, 'Expiry is required'),
  cvc: z.string().min(3, 'CVC is required'),
});

export type CreateInvoiceCheckoutSessionInput = z.infer<
  typeof CreateInvoiceCheckoutSessionSchema
>;

export type MockInvoicePaymentInput = z.infer<typeof MockInvoicePaymentSchema>;

export { InvoiceStatusEnum };
