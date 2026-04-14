import type { RecurringInvoiceListResponse, RecurringInvoiceResponse } from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const RecurringInvoicesService = {
  async getSchedules(params: { businessId: string; page?: number; limit?: number }): Promise<RecurringInvoiceListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = { businessId: params.businessId, page: params.page ?? 1, limit: params.limit ?? 10 };
      return await client.get(API_CONFIG.RECURRING_INVOICES.LIST, { searchParams }).json<RecurringInvoiceListResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getById(id: string, businessId: string): Promise<RecurringInvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.get(API_CONFIG.RECURRING_INVOICES.GET.replace('{id}', id), { searchParams: { businessId } }).json<RecurringInvoiceResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async create(data: Record<string, unknown>): Promise<RecurringInvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.post(API_CONFIG.RECURRING_INVOICES.CREATE, { json: data }).json<RecurringInvoiceResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async update(id: string, data: Record<string, unknown>): Promise<RecurringInvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.patch(API_CONFIG.RECURRING_INVOICES.UPDATE.replace('{id}', id), { json: data }).json<RecurringInvoiceResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async delete(id: string, businessId: string): Promise<void> {
    const client = createAuthenticatedClient();
    try {
      await client.delete(API_CONFIG.RECURRING_INVOICES.DELETE.replace('{id}', id), { searchParams: { businessId } });
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
