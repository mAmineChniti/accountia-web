import type { VatReportResponse } from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const ReportsService = {
  async getVatReport(params: {
    businessId: string;
    period: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    year?: string;
    month?: string;
    quarter?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<VatReportResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = { businessId: params.businessId, period: params.period };
      if (params.year) searchParams.year = params.year;
      if (params.month) searchParams.month = params.month;
      if (params.quarter) searchParams.quarter = params.quarter;
      if (params.startDate) searchParams.startDate = params.startDate;
      if (params.endDate) searchParams.endDate = params.endDate;
      return await client.get(API_CONFIG.REPORTS.VAT, { searchParams }).json<VatReportResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
