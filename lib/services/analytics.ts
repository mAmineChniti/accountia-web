import type { AnalyticsDashboardResponse } from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const AnalyticsService = {
  async getDashboard(params: {
    businessId: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'monthly' | 'weekly' | 'yearly';
  }): Promise<AnalyticsDashboardResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = { businessId: params.businessId };
      if (params.startDate) searchParams.startDate = params.startDate;
      if (params.endDate) searchParams.endDate = params.endDate;
      if (params.groupBy) searchParams.groupBy = params.groupBy;
      return await client.get(API_CONFIG.ANALYTICS.DASHBOARD, { searchParams }).json<AnalyticsDashboardResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
