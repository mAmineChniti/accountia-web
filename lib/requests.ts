import { env } from '@/env';
import ky from 'ky';
import { getToken, setTokens } from '@/actions/cookies';
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  FetchUserByIdInput,
  UpdateUserInput,
  ResendConfirmationInput,
  ForgotPasswordInput,
  TwoFAVerifyInput,
  TwoFALoginInput,
  TwoFADisableInput,
  ChangeRoleInput,
  BusinessApplicationInput,
  ReviewApplicationInput,
  UpdateBusinessInput,
  AssignUserInput,
  ChangeClientRoleInput,
  GoogleOAuthExchangeInput,
  CreateProductInput,
  UpdateProductInput,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  TransitionInvoiceInput,
  ChatMessageInput,
} from '@/types/RequestSchemas';
import type {
  RegisterResponse,
  LoginResult,
  LogoutResponse,
  RefreshTokenResponse,
  FetchUserResponse,
  FetchUserByIdResponse,
  UpdateUserResponse,
  DeleteUserResponse,
  DeleteUserByAdminResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  ResendConfirmationResponse,
  UsersListResponse,
  TwoFASetupResponse,
  TwoFAVerifyResponse,
  TwoFALoginResponse,
  ChangeRoleResponse,
  BusinessApplicationResponse,
  MyBusinessesResponse,
  AllBusinessesResponse,
  BusinessDetailResponse,
  BusinessApplicationsListResponse,
  ReviewApplicationResponse,
  AssignUserResponse,
  GetBusinessClientsResponse,
  ChangeClientRoleResponse,
  TwoFADisableResponse,
  BanUserResponse,
  UnbanUserResponse,
  CreateProductResponse,
  ProductListResponse,
  ProductDetailResponse,
  UpdateProductResponse,
  ProductImportResponse,
  InvoiceResponse,
  InvoiceListResponse,
  ReceivedInvoiceListResponse,
  TenantMetadataResponse,
  ChatMessageResponse,
  NotificationListResponse,
  AuditLogListResponse,
  HealthCheckResponse,
  BusinessStatisticsResponse,
  InvoiceImportResponse,
  BusinessMessageResponse,
} from '@/types/ResponseInterfaces';

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

interface HTTPErrorLike {
  response: {
    json: () => Promise<unknown>;
    text: () => Promise<string>;
    headers: {
      get: (name: string) => string | null;
    };
  };
}

const safeParseJson = async (
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

const API_CONFIG = {
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
    GET_STATISTICS: 'business/{id}/statistics',
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

const createAuthenticatedClient = () => {
  return ky.create({
    prefixUrl: API_CONFIG.BASE_URL,
    hooks: {
      beforeRequest: [
        async (request) => {
          const tokenData = await getToken();
          if (tokenData) {
            request.headers.set('Authorization', `Bearer ${tokenData.token}`);
          }
          return request;
        },
      ],
    },
  });
};

const publicClient = ky.create({
  prefixUrl: API_CONFIG.BASE_URL,
});

export const AuthService = {
  getGoogleAuthUrl(options: {
    lang: string;
    mode: 'login' | 'register';
    redirectUri?: string;
  }): string {
    const baseUrl = API_CONFIG.BASE_URL.endsWith('/')
      ? API_CONFIG.BASE_URL.slice(0, -1)
      : API_CONFIG.BASE_URL;

    const redirectUri =
      options.redirectUri ??
      (globalThis.window === undefined
        ? undefined
        : `${globalThis.location.origin}/${options.lang}/auth/callback`);

    const url = new URL(`${baseUrl}/${API_CONFIG.AUTH.GOOGLE}`);
    url.searchParams.set('mode', options.mode);
    url.searchParams.set('lang', options.lang);
    if (redirectUri) {
      url.searchParams.set('redirectUri', redirectUri);
    }

    return url.toString();
  },

  async setupTwoFactor(): Promise<TwoFASetupResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.AUTH.TWO_FA_SETUP)
        .json<TwoFASetupResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async verifyTwoFactor(data: TwoFAVerifyInput): Promise<TwoFAVerifyResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.AUTH.TWO_FA_VERIFY, {
          json: data,
        })
        .json<TwoFAVerifyResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async twoFactorLogin(data: TwoFALoginInput): Promise<TwoFALoginResponse> {
    try {
      const result = await publicClient
        .post(API_CONFIG.AUTH.TWO_FA_LOGIN, {
          json: data,
        })
        .json<TwoFALoginResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },
  async register(data: RegisterInput): Promise<RegisterResponse> {
    try {
      const result = await publicClient
        .post(API_CONFIG.AUTH.REGISTER, {
          json: data,
        })
        .json<RegisterResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async login(data: LoginInput): Promise<LoginResult> {
    try {
      const result = await publicClient
        .post(API_CONFIG.AUTH.LOGIN, {
          json: data,
        })
        .json<LoginResult>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async exchangeGoogleOAuthCode(
    data: GoogleOAuthExchangeInput
  ): Promise<LoginResult> {
    try {
      const result = await publicClient
        .post(API_CONFIG.AUTH.GOOGLE_EXCHANGE, {
          json: data,
        })
        .json<LoginResult>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async logout(refreshToken: string): Promise<LogoutResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.AUTH.LOGOUT, {
          json: { refreshToken },
        })
        .json<LogoutResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    const tokenData = await getToken();
    if (!tokenData?.token) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }

    try {
      const result = await publicClient
        .post(API_CONFIG.AUTH.REFRESH, {
          headers: {
            Authorization: `Bearer ${tokenData.token}`,
          },
        })
        .json<RefreshTokenResponse>();

      await setTokens({
        token: result.accessToken,
        refreshToken: result.refreshToken || tokenData.refreshToken,
        expires_at:
          result.accessTokenExpiresAt ||
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        expires_at_ts: result.accessTokenExpiresAt
          ? new Date(result.accessTokenExpiresAt).getTime()
          : Date.now() + 24 * 60 * 60 * 1000,
        refresh_expires_at:
          result.refreshTokenExpiresAt ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        refresh_expires_at_ts: result.refreshTokenExpiresAt
          ? new Date(result.refreshTokenExpiresAt).getTime()
          : Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async forgotPassword(
    data: ForgotPasswordInput
  ): Promise<ForgotPasswordResponse> {
    try {
      const result = await publicClient
        .post(API_CONFIG.AUTH.FORGOT_PASSWORD, {
          json: data,
        })
        .json<ForgotPasswordResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async resetPassword(
    data: ResetPasswordInput
  ): Promise<ResetPasswordResponse> {
    try {
      const result = await publicClient
        .post(API_CONFIG.AUTH.RESET_PASSWORD, {
          json: data,
        })
        .json<ResetPasswordResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async fetchUser(): Promise<FetchUserResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(API_CONFIG.AUTH.FETCH_USER)
        .json<FetchUserResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async fetchUserWithAccessToken(
    accessToken: string
  ): Promise<FetchUserResponse> {
    if (!accessToken) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }

    try {
      const result = await publicClient
        .get(API_CONFIG.AUTH.FETCH_USER, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .json<FetchUserResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async fetchUserById(
    data: FetchUserByIdInput
  ): Promise<FetchUserByIdResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.AUTH.FETCH_USER_BY_ID, {
          json: data,
        })
        .json<FetchUserByIdResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async updateUser(data: UpdateUserInput): Promise<UpdateUserResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .put(API_CONFIG.AUTH.UPDATE, {
          json: data,
        })
        .json<UpdateUserResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async patchUser(data: UpdateUserInput): Promise<UpdateUserResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .patch(API_CONFIG.AUTH.UPDATE, {
          json: data,
        })
        .json<UpdateUserResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async deleteUser(): Promise<DeleteUserResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .delete(API_CONFIG.AUTH.DELETE)
        .json<DeleteUserResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async resendConfirmationEmail(
    data: ResendConfirmationInput
  ): Promise<ResendConfirmationResponse> {
    try {
      const result = await publicClient
        .post(API_CONFIG.AUTH.RESEND_CONFIRMATION, {
          json: data,
        })
        .json<ResendConfirmationResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async fetchAllUsers(): Promise<UsersListResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(API_CONFIG.AUTH.FETCH_ALL_USERS)
        .json<UsersListResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async deleteUserByAdmin(userId: string): Promise<DeleteUserByAdminResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .delete(API_CONFIG.AUTH.DELETE_USER_BY_ADMIN.replace('{id}', userId))
        .json<DeleteUserByAdminResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async changeRole(data: ChangeRoleInput): Promise<ChangeRoleResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .patch(API_CONFIG.AUTH.CHANGE_ROLE, {
          json: data,
        })
        .json<ChangeRoleResponse>();
      return result;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errorLike = error as HTTPErrorLike;
        const errorData = await safeParseJson(errorLike.response);
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async disableTwoFactor(
    data: TwoFADisableInput
  ): Promise<TwoFADisableResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.AUTH.TWO_FA_DISABLE, {
          json: data,
        })
        .json<TwoFADisableResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async banUser(userId: string, reason: string): Promise<BanUserResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.AUTH.BAN_USER.replace('{id}', userId);
      const result = await client
        .patch(endpoint, { json: { reason } })
        .json<BanUserResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async unbanUser(userId: string): Promise<UnbanUserResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.AUTH.UNBAN_USER.replace('{id}', userId);
      const result = await client.patch(endpoint).json<UnbanUserResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },
};

export const BusinessService = {
  async applyForBusiness(
    data: BusinessApplicationInput
  ): Promise<BusinessApplicationResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.BUSINESS.APPLY, { json: data })
        .json<BusinessApplicationResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getApplications(): Promise<BusinessApplicationsListResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(API_CONFIG.BUSINESS.APPLICATIONS)
        .json<BusinessApplicationsListResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async reviewApplication(
    id: string,
    data: ReviewApplicationInput
  ): Promise<ReviewApplicationResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.REVIEW_APPLICATION.replace(
        '{id}',
        id
      );
      const result = await client
        .post(endpoint, {
          json: data,
        })
        .json<ReviewApplicationResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getMyBusinesses(): Promise<MyBusinessesResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(API_CONFIG.BUSINESS.MY_BUSINESSES)
        .json<MyBusinessesResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getAllBusinesses(): Promise<AllBusinessesResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(API_CONFIG.BUSINESS.ALL_BUSINESSES)
        .json<AllBusinessesResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getBusinessById(
    id: string,
    businessId: string
  ): Promise<BusinessDetailResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.GET_BUSINESS.replace('{id}', id);
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(endpoint, { searchParams })
        .json<BusinessDetailResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async updateBusiness(
    id: string,
    data: UpdateBusinessInput
  ): Promise<BusinessDetailResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.UPDATE_BUSINESS.replace('{id}', id);
      const result = await client
        .put(endpoint, { json: data })
        .json<BusinessDetailResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async deleteBusiness(id: string): Promise<BusinessMessageResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.DELETE_BUSINESS.replace('{id}', id);
      const result = await client
        .delete(endpoint)
        .json<BusinessMessageResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async assignUser(
    businessId: string,
    data: AssignUserInput
  ): Promise<AssignUserResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.ASSIGN_USER.replace(
        '{id}',
        businessId
      );
      const result = await client
        .post(endpoint, { json: data })
        .json<AssignUserResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async unassignUser(
    businessId: string,
    userId: string
  ): Promise<BusinessMessageResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.UNASSIGN_USER.replace(
        '{id}',
        businessId
      ).replace('{userId}', userId);
      const result = await client
        .delete(endpoint)
        .json<BusinessMessageResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getTenantMetadata(
    id: string,
    businessId: string
  ): Promise<TenantMetadataResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.TENANT_METADATA.replace('{id}', id);
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(endpoint, { searchParams })
        .json<TenantMetadataResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getBusinessClients(
    businessId: string
  ): Promise<GetBusinessClientsResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.GET_CLIENTS.replace(
        '{id}',
        businessId
      );
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(endpoint, { searchParams })
        .json<GetBusinessClientsResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async changeClientRole(
    businessId: string,
    clientId: string,
    data: ChangeClientRoleInput
  ): Promise<ChangeClientRoleResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.CHANGE_CLIENT_ROLE.replace(
        '{id}',
        businessId
      ).replace('{clientId}', clientId);
      const result = await client
        .patch(endpoint, { json: data })
        .json<ChangeClientRoleResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async deleteClient(
    businessId: string,
    clientId: string
  ): Promise<BusinessMessageResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.DELETE_CLIENT.replace(
        '{id}',
        businessId
      ).replace('{clientId}', clientId);
      const result = await client
        .delete(endpoint)
        .json<BusinessMessageResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getBusinessStatistics(
    businessId: string
  ): Promise<BusinessStatisticsResponse> {
    // Validate businessId before constructing endpoint
    if (
      !businessId ||
      typeof businessId !== 'string' ||
      businessId.trim() === ''
    ) {
      throw new Error('Invalid businessId: must be a non-empty string');
    }
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.GET_STATISTICS.replace(
        '{id}',
        businessId
      );
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(endpoint, { searchParams })
        .json<BusinessStatisticsResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },
};

export const ProductsService = {
  async getProducts(
    page: number = 1,
    limit: number = 10,
    businessId?: string,
    search?: string
  ): Promise<ProductListResponse> {
    const client = createAuthenticatedClient();
    try {
      const headers: Record<string, string> = {};
      const searchParams: Record<string, string | number> = { page, limit };
      if (businessId) {
        searchParams.businessId = businessId;
      }
      if (search) {
        searchParams.search = search;
      }

      const result = await client
        .get(API_CONFIG.PRODUCTS.LIST, {
          searchParams,
          headers,
        })
        .json<ProductListResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async createProduct(
    data: CreateProductInput
  ): Promise<CreateProductResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.PRODUCTS.CREATE, {
          json: data,
        })
        .json<CreateProductResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getProductById(
    id: string,
    businessId: string
  ): Promise<ProductDetailResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(API_CONFIG.PRODUCTS.GET.replace('{id}', id), { searchParams })
        .json<ProductDetailResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async updateProduct(
    id: string,
    data: UpdateProductInput
  ): Promise<UpdateProductResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .patch(API_CONFIG.PRODUCTS.UPDATE.replace('{id}', id), {
          json: data,
        })
        .json<UpdateProductResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async deleteProduct(id: string, businessId: string): Promise<void> {
    const client = createAuthenticatedClient();
    try {
      await client.delete(API_CONFIG.PRODUCTS.DELETE.replace('{id}', id), {
        json: { businessId },
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async importProducts(
    file: File,
    businessId: string
  ): Promise<ProductImportResponse> {
    const client = createAuthenticatedClient();
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessId', businessId);
      const result = await client
        .post(API_CONFIG.PRODUCTS.IMPORT, { body: formData })
        .json<ProductImportResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },
};

export const InvoicesService = {
  // ============= ISSUER ENDPOINTS =============

  // 1. Create Invoice (Draft)
  async createInvoice(data: CreateInvoiceInput): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.INVOICES.CREATE, { json: data })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  // 2. List Issued Invoices
  async listIssuedInvoices(params?: {
    businessId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<InvoiceListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      };
      if (params?.businessId) searchParams.businessId = params.businessId;
      if (params?.status) searchParams.status = params.status;
      const result = await client
        .get(API_CONFIG.INVOICES.LIST_ISSUED, { searchParams })
        .json<InvoiceListResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  // 3. Get Single Issued Invoice
  async getIssuedInvoice(
    id: string,
    businessId: string
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {
        businessId,
      };
      const result = await client
        .get(API_CONFIG.INVOICES.GET_ISSUED.replace('{id}', id), {
          searchParams,
        })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  // 4. Update Draft Invoice
  async updateInvoice(
    id: string,
    data: UpdateInvoiceInput
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .patch(API_CONFIG.INVOICES.UPDATE_ISSUED.replace('{id}', id), {
          json: data,
        })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  // 5. Transition Invoice State
  async transitionInvoice(
    id: string,
    data: TransitionInvoiceInput
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.INVOICES.TRANSITION.replace('{id}', id), {
          json: data,
        })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  // ============= RECIPIENT ENDPOINTS =============

  // 6. Get Invoices Received by Business
  async getReceivedInvoicesByBusiness(params?: {
    businessId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ReceivedInvoiceListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      };
      if (params?.status) searchParams.status = params.status;
      if (params?.businessId) searchParams.businessId = params.businessId;
      const result = await client
        .get(API_CONFIG.INVOICES.LIST_RECEIVED_BUSINESS, { searchParams })
        .json<ReceivedInvoiceListResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  // 7. Get Invoices Received by Individual
  async getReceivedInvoicesByIndividual(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ReceivedInvoiceListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      };
      if (params?.status) searchParams.status = params.status;
      const result = await client
        .get(API_CONFIG.INVOICES.LIST_RECEIVED_INDIVIDUAL, { searchParams })
        .json<ReceivedInvoiceListResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  // 8. Get Full Invoice Details (Business Recipient)
  async getReceivedInvoiceDetails(
    receiptId: string,
    businessId: string
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {
        businessId,
      };
      const result = await client
        .get(
          API_CONFIG.INVOICES.GET_RECEIVED_DETAILS.replace(
            '{receiptId}',
            receiptId
          ),
          {
            searchParams,
          }
        )
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  // 9. Get Full Invoice Details (Individual Recipient)
  async getReceivedIndividualInvoiceDetails(
    receiptId: string,
    businessId?: string
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {};
      if (businessId) searchParams.businessId = businessId;
      const result = await client
        .get(
          API_CONFIG.INVOICES.GET_RECEIVED_INDIVIDUAL_DETAILS.replace(
            '{receiptId}',
            receiptId
          ),
          {
            searchParams,
          }
        )
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  // 10. Import Invoices from File
  async importInvoices(file: File): Promise<InvoiceImportResponse> {
    const client = createAuthenticatedClient();
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await client
        .post(API_CONFIG.INVOICES.IMPORT, { body: formData })
        .json<InvoiceImportResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },
};

export const ChatService = {
  async sendMessage(data: ChatMessageInput): Promise<ChatMessageResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.CHAT.SEND_MESSAGE, { json: data })
        .json<ChatMessageResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },
};

export const NotificationsService = {
  async getNotifications(
    businessId?: string
  ): Promise<NotificationListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {};
      if (businessId) searchParams.businessId = businessId;
      const result = await client
        .get(API_CONFIG.NOTIFICATIONS.GET_NOTIFICATIONS, { searchParams })
        .json<NotificationListResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async markAsRead(notificationId: string): Promise<{ message: string }> {
    const client = createAuthenticatedClient();
    try {
      const url = API_CONFIG.NOTIFICATIONS.MARK_AS_READ.replace(
        '{id}',
        notificationId
      );
      const result = await client.patch(url).json<{ message: string }>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async markAllAsRead(businessId?: string): Promise<{ message: string }> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {};
      if (businessId) searchParams.businessId = businessId;
      const result = await client
        .patch(API_CONFIG.NOTIFICATIONS.MARK_ALL_AS_READ, { searchParams })
        .json<{ message: string }>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },
};

export const AuditService = {
  async getAuditLogs(
    page: number = 1,
    limit: number = 10,
    action?: string
  ): Promise<AuditLogListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = { page, limit };
      if (action) searchParams.action = action;
      const result = await client
        .get(API_CONFIG.AUDIT.GET_LOGS, { searchParams })
        .json<AuditLogListResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },
};

export const HealthService = {
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const result = await publicClient
        .get(API_CONFIG.HEALTH.CHECK)
        .json<HealthCheckResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },
};
