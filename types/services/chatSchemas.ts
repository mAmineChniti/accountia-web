import { z } from 'zod';

export const ChatMessageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  query: z.string().min(1, 'Query is required'),
  businessId: z.string().optional(),
  history: z
    .array(
      z.object({ role: z.enum(['user', 'assistant']), content: z.string() })
    )
    .optional(),
});

export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

export const ChatHistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type ChatHistoryMessage = z.infer<typeof ChatHistoryMessageSchema>;
