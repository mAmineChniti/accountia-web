import { z } from 'zod';

export const ChatMessageSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  query: z.string().min(1, 'Query is required'),
  history: z
    .array(
      z.object({ role: z.enum(['user', 'assistant']), content: z.string() })
    )
    .optional(),
});

export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
