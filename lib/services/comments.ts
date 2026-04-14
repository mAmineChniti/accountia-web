import type { CommentListResponse, CommentResponse } from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const CommentsService = {
  async getComments(params: {
    businessId: string;
    entityType: 'invoice' | 'expense' | 'purchase_order';
    entityId: string;
  }): Promise<CommentListResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client
        .get(API_CONFIG.COMMENTS.LIST, {
          searchParams: { businessId: params.businessId, entityType: params.entityType, entityId: params.entityId },
        })
        .json<CommentListResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async createComment(data: {
    businessId: string;
    entityType: string;
    entityId: string;
    body: string;
    parentId?: string;
    mentions?: string[];
  }): Promise<CommentResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.post(API_CONFIG.COMMENTS.CREATE, { json: data }).json<CommentResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async updateComment(id: string, data: { businessId: string; body: string }): Promise<CommentResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.patch(API_CONFIG.COMMENTS.UPDATE.replace('{id}', id), { json: data }).json<CommentResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async deleteComment(id: string, businessId: string): Promise<void> {
    const client = createAuthenticatedClient();
    try {
      await client.delete(API_CONFIG.COMMENTS.DELETE.replace('{id}', id), { json: { businessId }, searchParams: { businessId } });
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
