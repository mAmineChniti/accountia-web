import { env } from '@/env';
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

export const API_CONFIG = {
  BASE_URL: env.NEXT_PUBLIC_BACKEND ?? 'http://127.0.0.1:4789/api',
  AUTH: {
    REGISTER: 'auth/register',
    LOGIN: 'auth/login',
    LOGOUT: 'auth/logout',
    REFRESH: 'auth/refresh',
    FORGOT_PASSWORD: 'auth/forgot-password',
    RESET_PASSWORD: 'auth/reset-password',
    CONFIRM_EMAIL: 'auth/confirm-email/{token}',
    FETCH_USER: 'auth/fetchuser',
    FETCH_USER_BY_ID: 'auth/fetchuserbyid',
    UPDATE: 'auth/update',
    DELETE: 'auth/delete',
    RESEND_CONFIRMATION: 'auth/resend-confirmation-email',
    FETCH_ALL_USERS: 'auth/users',
    DELETE_USER_BY_ADMIN: 'auth/users/{id}',
    CHANGE_ROLE: 'auth/change-role',
    TWO_FA_SETUP: 'auth/2fa/setup',
    TWO_FA_VERIFY: 'auth/2fa/verify',
    TWO_FA_DISABLE: 'auth/2fa/disable',
    TWO_FA_LOGIN: 'auth/2fa/login',
    BAN_USER: 'auth/users/{id}/ban',
    UNBAN_USER: 'auth/users/{id}/unban',
    GOOGLE: 'auth/google',
    GOOGLE_EXCHANGE: 'auth/google/exchange',
    GOOGLE_CALLBACK: 'auth/google/callback',
  },
  BUSINESS: {
    APPLY: 'business/apply',
    APPLICATIONS: 'business/applications',
    REVIEW_APPLICATION: 'business/applications/{id}/review',
    MY_BUSINESSES: 'business/my-businesses',
    ALL_BUSINESSES: 'business/all',
    GET_BUSINESS: 'business/{id}',
    UPDATE_BUSINESS: 'business/{id}',
    DELETE_BUSINESS: 'business/{id}',
    ASSIGN_USER: 'business/{id}/users',
    UNASSIGN_USER: 'business/{id}/users/{userId}',
    TENANT_METADATA: 'business/{id}/tenant/metadata',
    GET_CLIENTS: 'business/{id}/clients',
    CHANGE_CLIENT_ROLE: 'business/{id}/clients/{clientId}/role',
    DELETE_CLIENT: 'business/{id}/clients/{clientId}',
    GET_STATISTICS: 'business/statistics',
    GET_CLIENT_PODIUM: 'business/client-podium',
    INVITE_USER: 'business/{id}/invites',
    RESEND_INVITE: 'business/{id}/invites/resend',
  },
  PRODUCTS: {
    CREATE: 'products',
    LIST: 'products',
    GET: 'products/{id}',
    UPDATE: 'products/{id}',
    DELETE: 'products/{id}',
    IMPORT: 'products/import',
  },
  INVOICES: {
    // Issuer Endpoints
    CREATE: 'invoices',
    LIST_ISSUED: 'invoices/issued',
    GET_ISSUED: 'invoices/issued/{id}',
    UPDATE_ISSUED: 'invoices/issued/{id}',
    TRANSITION: 'invoices/issued/{id}/transition',
    IMPORT: 'invoices/import',
    IMPORT_TEMPLATE: 'invoices/import/template',
    // Recipient Endpoints
    LIST_RECEIVED_BUSINESS: 'invoices/received/business',
    LIST_RECEIVED_INDIVIDUAL: 'invoices/received/individual',
    GET_RECEIVED_DETAILS: 'invoices/received/{receiptId}/details',
    GET_RECEIVED_INDIVIDUAL_DETAILS:
      'invoices/received/individual/{receiptId}/details',
  },
  CHAT: {
    SEND_MESSAGE: 'chat/message',
  },
  NOTIFICATIONS: {
    GET_NOTIFICATIONS: 'notifications',
    MARK_AS_READ: 'notifications/{id}/read',
    MARK_ALL_AS_READ: 'notifications/read-all',
  },
  AUDIT: {
    GET_LOGS: 'audit',
  },
  HEALTH: {
    CHECK: 'health',
  },
} as const;

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
