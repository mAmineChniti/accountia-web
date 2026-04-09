export type NotificationType =
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.viewed'
  | 'invoice.overdue'
  | 'business.approved'
  | 'business.rejected'
  | 'user.added'
  | 'user.removed';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  payload?: Record<string, unknown>;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}
