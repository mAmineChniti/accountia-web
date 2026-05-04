import type {
  CollectionsDashboard,
  InvoiceRiskScore,
  GenerateReminderResponse,
} from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const CollectionsService = {
  /** Full dashboard: risk scores + aggregate breakdown */
  async getDashboard(businessId: string): Promise<CollectionsDashboard> {
    const client = createAuthenticatedClient();
    try {
      return await client
        .get(API_CONFIG.COLLECTIONS.DASHBOARD, { searchParams: { businessId } })
        .json<CollectionsDashboard>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  /** Lightweight list of risk scores only */
  async getRiskScores(businessId: string): Promise<InvoiceRiskScore[]> {
    const client = createAuthenticatedClient();
    try {
      return await client
        .get(API_CONFIG.COLLECTIONS.RISK_SCORES, {
          searchParams: { businessId },
        })
        .json<InvoiceRiskScore[]>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  /** Generate AI reminder for a specific invoice */
  async generateReminder(
    invoiceId: string,
    businessId: string
  ): Promise<GenerateReminderResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.COLLECTIONS.GENERATE_REMINDER.replace(
        '{id}',
        encodeURIComponent(invoiceId)
      );
      return await client
        .post(endpoint, { searchParams: { businessId }, json: {} })
        .json<GenerateReminderResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
