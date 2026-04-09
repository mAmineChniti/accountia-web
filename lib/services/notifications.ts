import type { NotificationListResponse } from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const NotificationsService = {
  async getNotifications(
    businessId?: string
  ): Promise<NotificationListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {};
      if (businessId) searchParams.businessId = businessId;
      const result = await client
        .get(API_CONFIG.NOTIFICATIONS.GET_NOTIFICATIONS, { searchParams })
        .json<NotificationListResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async markAsRead(notificationId: string): Promise<{ message: string }> {
    const client = createAuthenticatedClient();
    try {
      const url = API_CONFIG.NOTIFICATIONS.MARK_AS_READ.replace(
        '{id}',
        notificationId
      );
      const result = await client.patch(url).json<{ message: string }>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async markAllAsRead(businessId?: string): Promise<{ message: string }> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {};
      if (businessId) searchParams.businessId = businessId;
      const result = await client
        .patch(API_CONFIG.NOTIFICATIONS.MARK_ALL_AS_READ, { searchParams })
        .json<{ message: string }>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
