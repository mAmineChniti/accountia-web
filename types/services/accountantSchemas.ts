import { z } from 'zod';

const DateSchema = z.iso
  .date({ error: 'Invalid ISO date' })
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
  });

export const ListAccountingJobsQuerySchema = z.object({
  businessId: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const GetJobStatusParamsSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

export const GetJobStatusQuerySchema = z.object({
  businessId: z.string().optional(),
});

export const CancelJobParamsSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

export const CancelJobQuerySchema = z.object({
  businessId: z.string().optional(),
});

export const GetAccountingHistoryQuerySchema = z.object({
  businessId: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const GetJobResultsParamsSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

export const GetJobResultsQuerySchema = z.object({
  businessId: z.string().optional(),
});

export const GetAllAccountantWorkQuerySchema = z
  .object({
    businessId: z.string().optional(),
    startDate: DateSchema.optional(),
    endDate: DateSchema.optional(),
    status: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      data.endDate.getTime() >= data.startDate.getTime(),
    {
      message: 'End date must be after or equal to start date',
      path: ['endDate'],
    }
  );

export const GetTaxesQuerySchema = z.object({
  businessId: z.string().optional(),
  year: z.coerce.number().int().gte(2000).lte(2100).optional(),
});

export const CalculateTaxesQuerySchema = z.object({
  businessId: z.string().optional(),
  year: z.coerce.number().int().gte(2000).lte(2100).optional(),
});

export type CreateAccountingJobInput = z.input<
  typeof CreateAccountingJobSchema
>;
export type ListAccountingJobsQuery = z.infer<
  typeof ListAccountingJobsQuerySchema
>;
export type GetJobStatusParams = z.infer<typeof GetJobStatusParamsSchema>;
export type GetJobStatusQuery = z.infer<typeof GetJobStatusQuerySchema>;
export type GetJobResultsParams = z.infer<typeof GetJobResultsParamsSchema>;
export type GetJobResultsQuery = z.infer<typeof GetJobResultsQuerySchema>;
export type CancelJobParams = z.infer<typeof CancelJobParamsSchema>;
export type CancelJobQuery = z.infer<typeof CancelJobQuerySchema>;
export type GetAccountingHistoryQuery = z.infer<
  typeof GetAccountingHistoryQuerySchema
>;
export type GetAllAccountantWorkQuery = z.infer<
  typeof GetAllAccountantWorkQuerySchema
>;
export type GetTaxesQuery = z.infer<typeof GetTaxesQuerySchema>;
export type CalculateTaxesQuery = z.infer<typeof CalculateTaxesQuerySchema>;
