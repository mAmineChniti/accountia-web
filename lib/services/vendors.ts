import type { VendorListResponse, VendorResponse } from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const VendorsService = {
  async getVendors(params: { businessId: string; page?: number; limit?: number; search?: string }): Promise<VendorListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = { businessId: params.businessId, page: params.page ?? 1, limit: params.limit ?? 10 };
      if (params.search) searchParams.search = params.search;
      return await client.get(API_CONFIG.VENDORS.LIST, { searchParams }).json<VendorListResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getVendorById(id: string, businessId: string): Promise<VendorResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.get(API_CONFIG.VENDORS.GET.replace('{id}', id), { searchParams: { businessId } }).json<VendorResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async createVendor(data: Record<string, unknown>): Promise<VendorResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.post(API_CONFIG.VENDORS.CREATE, { json: data }).json<VendorResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async updateVendor(id: string, data: Record<string, unknown>): Promise<VendorResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.patch(API_CONFIG.VENDORS.UPDATE.replace('{id}', id), { json: data }).json<VendorResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async deleteVendor(id: string, businessId: string): Promise<void> {
    const client = createAuthenticatedClient();
    try {
      await client.delete(API_CONFIG.VENDORS.DELETE.replace('{id}', id), { searchParams: { businessId } });
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
