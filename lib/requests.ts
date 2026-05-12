import ky from 'ky';
import { getToken } from '@/actions/cookies';

export class ApiError extends Error {
  public readonly type?: string;
  public readonly email?: string;
  public readonly statusCode?: number;

  constructor(
    message: string,
    options?: {
      type?: string;
      email?: string;
      statusCode?: number;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = options?.type;
    this.email = options?.email;
    this.statusCode = options?.statusCode;
  }

  static fromResponse(response: unknown): ApiError {
    const errorResponse = response as {
      message?: string;
      type?: string;
      email?: string;
      statusCode?: number;
    };
    return new ApiError(errorResponse.message || 'Unknown error', {
      type: errorResponse.type,
      email: errorResponse.email,
      statusCode: errorResponse.statusCode,
    });
  }
}

export interface HTTPErrorLike {
  response: {
    json: () => Promise<unknown>;
    text: () => Promise<string>;
    headers: {
      get: (name: string) => string | null;
    };
  };
}

export const safeParseJson = async (
  response: HTTPErrorLike['response']
): Promise<unknown> => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      return { message: text || 'Unknown error' };
    }
  } catch {
    return { message: 'Failed to parse error response' };
  }
};

import { API_CONFIG } from './api-config';

export const createAuthenticatedClient = () => {
  return ky.create({
    prefixUrl: API_CONFIG.BASE_URL,
    hooks: {
      beforeRequest: [
        async (request) => {
          const tokenData = await getToken();
          const token = tokenData?.token;
          if (!token) {
            const authErrorResponse = Response.json(
              {
                message: 'Missing auth token',
                type: 'AUTH_TOKEN_MISSING',
                statusCode: 401,
              },
              {
                status: 401,
                headers: { 'content-type': 'application/json' },
              }
            );
            const authError = new Error(
              'Missing auth token in createAuthenticatedClient'
            ) as Error & HTTPErrorLike;
            authError.response = authErrorResponse;
            throw authError;
          }
          request.headers.set('Authorization', `Bearer ${token}`);
          return request;
        },
      ],
    },
  });
};

export const publicClient = ky.create({
  prefixUrl: API_CONFIG.BASE_URL,
});

// ============= Service Imports =============
export { AuthService } from '@/lib/services/auth';
export { BusinessService } from '@/lib/services/business';
export { ProductsService } from '@/lib/services/products';
export { InvoicesService } from '@/lib/services/invoices';
export { ChatService } from '@/lib/services/chat';
export { NotificationsService } from '@/lib/services/notifications';
export { AuditService } from '@/lib/services/audit';
export { ExpensesService } from '@/lib/services/expenses';
export { AnalyticsService } from '@/lib/services/analytics';
export { VendorsService } from '@/lib/services/vendors';
export { PurchaseOrdersService } from '@/lib/services/purchase-orders';
export { ReportsService } from '@/lib/services/reports';
export { CommentsService } from '@/lib/services/comments';
export { RecurringInvoicesService } from '@/lib/services/recurring-invoices';
export { ClientPortalAdminService } from '@/lib/services/client-portal-admin';
export type { GeneratePortalTokenResponse } from '@/lib/services/client-portal-admin';
export { AccountantService } from '@/lib/services/accountant';

export { API_CONFIG } from './api-config';
