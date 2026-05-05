import { z } from 'zod';

const DateSchema = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid ISO datetime',
  })
  .transform((val) => new Date(val));

export const CreateAccountingJobSchema = z
  .object({
    businessId: z.string().min(1, 'Business ID is required'),
    periodStart: DateSchema,
    periodEnd: DateSchema,
  })
  .refine((data) => data.periodEnd.getTime() >= data.periodStart.getTime(), {
    message: 'Period end must be after or equal to period start',
    path: ['periodEnd'],
  })
  .refine(
    (data) =>
      data.periodEnd.getTime() - data.periodStart.getTime() <=
      365 * 24 * 60 * 60 * 1000,
    {
      message: 'Period length must not exceed 365 days',
      path: ['periodEnd'],
    }
  );

export type CreateAccountingJobRequest = z.infer<
  typeof CreateAccountingJobSchema
>;

export const ListAccountingJobsQuerySchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const GetJobStatusParamsSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

export const GetJobStatusQuerySchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
});

export const GetJobResultsParamsSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

export const GetJobResultsQuerySchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
});

export const GetTaxesQuerySchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  year: z.coerce.number().int().gte(2000).lte(2100),
});

export const CalculateTaxesQuerySchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  year: z.coerce.number().int().gte(2000).lte(2100),
});

export type CreateAccountingJobInput = z.input<
  typeof CreateAccountingJobSchema
>;
export type CreateAccountingJobFormInput = z.input<
  typeof CreateAccountingJobSchema
>;
export type ListAccountingJobsQuery = z.infer<
  typeof ListAccountingJobsQuerySchema
>;
export type GetJobStatusParams = z.infer<typeof GetJobStatusParamsSchema>;
export type GetJobStatusQuery = z.infer<typeof GetJobStatusQuerySchema>;
export type GetJobResultsParams = z.infer<typeof GetJobResultsParamsSchema>;
export type GetJobResultsQuery = z.infer<typeof GetJobResultsQuerySchema>;
export type GetTaxesQuery = z.infer<typeof GetTaxesQuerySchema>;
export type CalculateTaxesQuery = z.infer<typeof CalculateTaxesQuerySchema>;
