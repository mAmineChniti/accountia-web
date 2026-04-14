import type { PurchaseOrderListResponse, PurchaseOrderResponse } from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const PurchaseOrdersService = {
  async getPurchaseOrders(params: { businessId: string; page?: number; limit?: number; status?: string }): Promise<PurchaseOrderListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = { businessId: params.businessId, page: params.page ?? 1, limit: params.limit ?? 10 };
      if (params.status) searchParams.status = params.status;
      return await client.get(API_CONFIG.PURCHASE_ORDERS.LIST, { searchParams }).json<PurchaseOrderListResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getPurchaseOrderById(id: string, businessId: string): Promise<PurchaseOrderResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.get(API_CONFIG.PURCHASE_ORDERS.GET.replace('{id}', id), { searchParams: { businessId } }).json<PurchaseOrderResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async createPurchaseOrder(data: Record<string, unknown>): Promise<PurchaseOrderResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.post(API_CONFIG.PURCHASE_ORDERS.CREATE, { json: data }).json<PurchaseOrderResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async updatePurchaseOrder(id: string, data: Record<string, unknown>): Promise<PurchaseOrderResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.patch(API_CONFIG.PURCHASE_ORDERS.UPDATE.replace('{id}', id), { json: data }).json<PurchaseOrderResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async submitPurchaseOrder(id: string, businessId: string): Promise<PurchaseOrderResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.patch(API_CONFIG.PURCHASE_ORDERS.SUBMIT.replace('{id}', id), { searchParams: { businessId } }).json<PurchaseOrderResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async approvePurchaseOrder(id: string, data: { businessId: string; rejectionReason?: string }): Promise<PurchaseOrderResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.patch(API_CONFIG.PURCHASE_ORDERS.APPROVE.replace('{id}', id), { json: data }).json<PurchaseOrderResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async receiveGoods(id: string, data: { businessId: string; receivedQuantities: Record<string, number> }): Promise<PurchaseOrderResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.patch(API_CONFIG.PURCHASE_ORDERS.RECEIVE.replace('{id}', id), { json: data }).json<PurchaseOrderResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async deletePurchaseOrder(id: string, businessId: string): Promise<void> {
    const client = createAuthenticatedClient();
    try {
      await client.delete(API_CONFIG.PURCHASE_ORDERS.DELETE.replace('{id}', id), { searchParams: { businessId } });
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
