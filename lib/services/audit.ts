import type { AuditAction, AuditLogListResponse } from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const AuditService = {
  async getAuditLogs(
    page: number = 1,
    limit: number = 10,
    action?: AuditAction
  ): Promise<AuditLogListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = { page, limit };
      if (action) searchParams.action = action;
      const result = await client
        .get(API_CONFIG.AUDIT.GET_LOGS, { searchParams })
        .json<AuditLogListResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
