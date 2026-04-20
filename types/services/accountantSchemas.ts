import { z } from 'zod';

export const CreateAccountingJobSchema = z
  .object({
    period_start: z.iso.date({ error: 'Invalid period start date' }),
    period_end: z.iso.date({ error: 'Invalid period end date' }),
  })
  .refine((data) => data.period_end >= data.period_start, {
    message: 'Period end date must be on or after period start date',
    path: ['period_end'],
  });

export const BulkDeleteProductsSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one product ID is required'),
});

export type CreateAccountingJobInput = z.infer<
  typeof CreateAccountingJobSchema
>;
export type BulkDeleteProductsInput = z.infer<typeof BulkDeleteProductsSchema>;
