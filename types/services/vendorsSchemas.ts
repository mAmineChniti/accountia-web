import { z } from 'zod';

export const CreateVendorSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(1, 'Vendor name is required'),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().optional(),
  paymentTermsDays: z.number().min(0).optional(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
