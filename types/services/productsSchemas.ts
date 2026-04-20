import { z } from 'zod';

export const CreateProductSchema = z
  .object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Product description is required'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    cost: z.number().min(0, 'Cost must be non-negative'),
    quantity: z
      .number()
      .int()
      .min(0, 'Quantity must be a non-negative integer'),
  })
  .superRefine((data, ctx) => {
    if (data.cost > data.unitPrice) {
      ctx.addIssue({
        code: 'custom',
        message: 'Cost cannot be greater than unit price',
        path: ['cost'],
      });
    }
  });

export const UpdateProductSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().min(1, 'Description must not be empty').optional(),
    unitPrice: z.number().min(0).optional(),
    cost: z.number().min(0).optional(),
    quantity: z.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.cost === 'number' &&
      typeof data.unitPrice === 'number' &&
      data.cost > data.unitPrice
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Cost cannot be greater than unit price',
        path: ['cost'],
      });
    }
  });

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
