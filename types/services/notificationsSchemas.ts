import { z } from 'zod';

export const GetNotificationsSchema = z.object({
  businessId: z.string().optional(),
});

export const MarkNotificationAsReadSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
});

export const MarkAllNotificationsAsReadSchema = z.object({
  businessId: z.string().optional(),
});

export type GetNotificationsInput = z.infer<typeof GetNotificationsSchema>;
export type MarkNotificationAsReadInput = z.infer<
  typeof MarkNotificationAsReadSchema
>;
export type MarkAllNotificationsAsReadInput = z.infer<
  typeof MarkAllNotificationsAsReadSchema
>;
