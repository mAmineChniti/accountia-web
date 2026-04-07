import { z } from 'zod';

const DateSchema = z.string().refine(
  (date) => {
    const parsedDate = new Date(date);
    return !Number.isNaN(parsedDate.getTime());
  },
  {
    message: 'Invalid ISO date',
  }
);

const OptionalDateSchema = z
  .string()
  .optional()
  .refine(
    (date) => {
      if (!date || date === '') return true; // Allow empty strings
      const parsedDate = new Date(date);
      return !Number.isNaN(parsedDate.getTime());
    },
    {
      message: 'Invalid ISO date',
    }
  );

const TwoFACodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Invalid authentication code')
  .length(6);

export const RegisterSchema = z.object({
  username: z.string().min(5).max(20),
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  birthdate: DateSchema,
  phoneNumber: z.string().optional(),
  acceptTerms: z.boolean().refine((value) => value === true, {
    message: 'Terms must be accepted',
  }),
  profilePicture: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const ForgotPasswordSchema = z.object({
  email: z.email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6),
});

export const ResendConfirmationSchema = z.object({
  email: z.email(),
});

export const FetchUserByIdSchema = z.object({
  userId: z.string(),
});

export const GoogleOAuthExchangeSchema = z.object({
  code: z.string().min(1, 'OAuth code is required'),
  redirectUri: z.string().optional(),
});

export const TwoFAVerifySchema = z.object({
  code: TwoFACodeSchema,
});

export const TwoFADisableSchema = z.object({
  code: TwoFACodeSchema,
});

export const ChangeRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newRole: z.string().min(1, 'New role is required'),
});

export const BusinessApplicationSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  website: z
    .url({ message: 'Must be a valid URL' })
    .optional()
    .or(z.literal('')),
  phone: z.string().min(6, 'Phone number is required'),
});

export const ReviewApplicationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().min(1, 'Review notes are required'),
});

export const UpdateBusinessSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  website: z.url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
});

export const AssignUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.string().min(1, 'Role is required'),
});

export const ChangeClientRoleSchema = z.object({
  role: z.string().min(1, 'Role is required'),
});

export const TwoFALoginSchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  code: TwoFACodeSchema,
});

export const UpdateUserSchema = z.object({
  username: z.string().min(5).max(20).optional(),
  email: z.email().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  birthdate: OptionalDateSchema,
  phoneNumber: z.string().optional(),
  profilePicture: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ResendConfirmationInput = z.infer<typeof ResendConfirmationSchema>;
export type FetchUserByIdInput = z.infer<typeof FetchUserByIdSchema>;
export type GoogleOAuthExchangeInput = z.infer<
  typeof GoogleOAuthExchangeSchema
>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export type TwoFAVerifyInput = z.infer<typeof TwoFAVerifySchema>;
export type TwoFADisableInput = z.infer<typeof TwoFADisableSchema>;
export type TwoFALoginInput = z.infer<typeof TwoFALoginSchema>;
export type ChangeRoleInput = z.infer<typeof ChangeRoleSchema>;
export type BusinessApplicationInput = z.infer<
  typeof BusinessApplicationSchema
>;
export type ReviewApplicationInput = z.infer<typeof ReviewApplicationSchema>;
export type UpdateBusinessInput = z.infer<typeof UpdateBusinessSchema>;
export type AssignUserInput = z.infer<typeof AssignUserSchema>;
export type ChangeClientRoleInput = z.infer<typeof ChangeClientRoleSchema>;

// ============= Products Schemas =============

export const CreateProductSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Product description is required'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  cost: z.number().min(0, 'Cost must be non-negative'),
  quantity: z.number().int().min(0, 'Quantity must be a non-negative integer'),
});

export const UpdateProductSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required').optional(),
  name: z.string().min(1).optional(),
  description: z.string().min(1, 'Description must not be empty').optional(),
  unitPrice: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
});

// ============= Invoices Schemas =============

// Recipient type enum for use throughout the app
export const INVOICE_RECIPIENT_TYPES = {
  EXTERNAL: 'EXTERNAL',
  PLATFORM_BUSINESS: 'PLATFORM_BUSINESS',
  PLATFORM_INDIVIDUAL: 'PLATFORM_INDIVIDUAL',
} as const;

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

// Separate schemas for each recipient type to enforce magic search requirements
const ExternalRecipientSchema = z.object({
  type: z.literal(INVOICE_RECIPIENT_TYPES.EXTERNAL),
  email: z.email('Valid email is required'),
  displayName: z
    .string()
    .min(1, 'Display name is required for external recipients'),
  platformId: z.string().optional(), // Not used for external
});

const PlatformRecipientSchema = z.object({
  type: z.enum([
    INVOICE_RECIPIENT_TYPES.PLATFORM_BUSINESS,
    INVOICE_RECIPIENT_TYPES.PLATFORM_INDIVIDUAL,
  ]),
  email: z.email('Valid email is required for magic search'),
  platformId: z.string().min(1).optional(), // Optional - if not provided, magic search by email
  displayName: z.string().optional(), // Not typically used for platform recipients
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
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
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
  businessId: z.string().min(1, 'Business ID is required').optional(),
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

export const LineItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
});

export const CreatePersonalInvoiceSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  clientUserId: z.string().min(1, 'Client user ID is required'),
  lineItems: z
    .array(LineItemSchema)
    .min(1, 'At least one line item is required'),
  issuedAt: DateSchema,
  dueDate: DateSchema,
});

export const UpdatePersonalInvoiceSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required').optional(),
  dueDate: OptionalDateSchema,
  lineItems: z.array(LineItemSchema).optional(),
  paid: z.boolean().optional(),
  paidAt: OptionalDateSchema,
});

export const CreateCompanyInvoiceSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  clientBusinessId: z.string().min(1, 'Client business ID is required'),
  clientCompanyName: z.string().min(1, 'Client company name is required'),
  clientContactEmail: z.email('Valid email is required'),
  lineItems: z
    .array(LineItemSchema)
    .min(1, 'At least one line item is required'),
  issuedAt: DateSchema,
  dueDate: DateSchema,
});

export const UpdateCompanyInvoiceSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required').optional(),
  clientCompanyName: z.string().min(1).optional(),
  clientContactEmail: z.email().optional(),
  dueDate: OptionalDateSchema,
  lineItems: z.array(LineItemSchema).optional(),
  paid: z.boolean().optional(),
  paidAt: OptionalDateSchema,
});

// ============= Chat Schemas =============

export const ChatMessageSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  query: z.string().min(1, 'Query is required'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
});

// ============= Ban/Unban User Schemas =============

export const BanUserSchema = z.object({
  reason: z.string().min(1, 'Ban reason is required'),
});

// Type exports
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type LineItemInput = z.infer<typeof LineItemSchema>;
export type CreateInvoiceRecipientInput = z.infer<
  typeof CreateInvoiceRecipientSchema
>;
export type CreateInvoiceLineItemInput = z.infer<
  typeof CreateInvoiceLineItemSchema
>;
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type TransitionInvoiceInput = z.infer<typeof TransitionInvoiceSchema>;
export type CreatePersonalInvoiceInput = z.infer<
  typeof CreatePersonalInvoiceSchema
>;
export type UpdatePersonalInvoiceInput = z.infer<
  typeof UpdatePersonalInvoiceSchema
>;
export type CreateCompanyInvoiceInput = z.infer<
  typeof CreateCompanyInvoiceSchema
>;
export type UpdateCompanyInvoiceInput = z.infer<
  typeof UpdateCompanyInvoiceSchema
>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type BanUserInput = z.infer<typeof BanUserSchema>;
