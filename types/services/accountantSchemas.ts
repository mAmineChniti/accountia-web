import { z } from 'zod';

// Normalize input to camelCase and validate dates
export const CreateAccountingJobSchema = z.preprocess(
  (raw) => {
    if (typeof raw !== 'object' || raw === null) return raw;
    const obj = raw as Record<string, unknown>;
    return {
      businessId: (obj.businessId ?? obj.business_id) as unknown,
      periodStart: (obj.periodStart ?? obj.period_start) as unknown,
      periodEnd: (obj.periodEnd ?? obj.period_end) as unknown,
    };
  },
  z
    .object({
      businessId: z.string().min(1, 'businessId is required'),
      periodStart: z
        .string()
        .min(1, 'Period start is required')
        .refine(
          (s) => !Number.isNaN(Date.parse(s)),
          'periodStart must be a valid ISO date'
        ),
      periodEnd: z
        .string()
        .min(1, 'Period end is required')
        .refine(
          (s) => !Number.isNaN(Date.parse(s)),
          'periodEnd must be a valid ISO date'
        ),
    })
    .refine(
      (val) => {
        const start = new Date(val.periodStart);
        const end = new Date(val.periodEnd);
        return end.getTime() >= start.getTime();
      },
      {
        message: 'periodEnd must be the same or after periodStart',
        path: ['periodEnd'],
      }
    )
    .refine(
      (val) => {
        const start = new Date(val.periodStart);
        const end = new Date(val.periodEnd);
        const msInDay = 24 * 60 * 60 * 1000;
        const diffDays = (end.getTime() - start.getTime()) / msInDay;
        return diffDays <= 365;
      },
      { message: 'Period length must not exceed 365 days', path: ['periodEnd'] }
    )
);

export type CreateAccountingJobInput = z.infer<
  typeof CreateAccountingJobSchema
>;
