import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export interface GeneratePortalTokenResponse {
  token: string;
  expiresAt: string;
  portalUrl: string;
}

export const ClientPortalAdminService = {
  async generateToken(data: {
    businessId: string;
    clientEmail: string;
    clientName?: string;
    expiryDays?: number;
  }): Promise<GeneratePortalTokenResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client
        .post(API_CONFIG.CLIENT_PORTAL.GENERATE_TOKEN, { json: data })
        .json<GeneratePortalTokenResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
