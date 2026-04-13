import { z } from 'zod';

export const ExpenseCategoryEnum = z.enum([
  'travel', 'meals', 'accommodation', 'office_supplies',
  'software', 'hardware', 'marketing', 'utilities',
  'professional_services', 'other',
]);

export const CreateExpenseSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  title: z.string().min(1, 'Title is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  currency: z.string().optional(),
  category: ExpenseCategoryEnum,
  expenseDate: z.string().min(1, 'Expense date is required'),
  description: z.string().optional(),
  vendor: z.string().optional(),
  receiptBase64: z.string().optional(),
  receiptMimeType: z.string().optional(),
  isBillable: z.boolean().optional(),
});

export const UpdateExpenseSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  title: z.string().min(1).optional(),
  amount: z.number().min(0).optional(),
  category: ExpenseCategoryEnum.optional(),
  expenseDate: z.string().optional(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  isBillable: z.boolean().optional(),
});

export const ReviewExpenseSchema = z.object({
  businessId: z.string().min(1),
  decision: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type ReviewExpenseInput = z.infer<typeof ReviewExpenseSchema>;
