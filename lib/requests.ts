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
  GoogleOAuthExchangeInput,
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
  BusinessMessageResponse,
  TwoFADisableResponse,
  BanUserResponse,
  UnbanUserResponse,
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
    FETCH_USER: 'auth/fetchuser',
    FETCH_USER_BY_ID: 'auth/fetchuserbyid',
    UPDATE: 'auth/update',
    DELETE: 'auth/delete',
    RESEND_CONFIRMATION: 'auth/resend-confirmation-email',
    FETCH_ALL_USERS: 'auth/users',
    DELETE_USER_BY_ADMIN: 'auth/users',
    CHANGE_ROLE: 'auth/change-role',
    TWO_FA_SETUP: 'auth/2fa/setup',
    TWO_FA_VERIFY: 'auth/2fa/verify',
    TWO_FA_DISABLE: 'auth/2fa/disable',
    TWO_FA_LOGIN: 'auth/2fa/login',
    BAN_USER: 'auth/users/{userId}/ban',
    UNBAN_USER: 'auth/users/{userId}/unban',
    GOOGLE: 'auth/google',
    GOOGLE_EXCHANGE: 'auth/google/exchange',
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
        .delete(`${API_CONFIG.AUTH.DELETE_USER_BY_ADMIN}/${userId}`)
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

  async banUser(userId: string): Promise<BanUserResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.AUTH.BAN_USER.replace('{userId}', userId);
      const result = await client.patch(endpoint).json<BanUserResponse>();
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
      const endpoint = API_CONFIG.AUTH.UNBAN_USER.replace('{userId}', userId);
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
        .post('business/apply', { json: data })
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
        .get('business/applications')
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
      const result = await client
        .post(`business/applications/${id}/review`, {
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
        .get('business/my')
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
        .get('business/all')
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

  async getBusinessById(id: string): Promise<BusinessDetailResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(`business/${id}`)
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
      const result = await client
        .put(`business/${id}`, { json: data })
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
      const result = await client
        .delete(`business/${id}`)
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
      const result = await client
        .post(`business/${businessId}/users`, { json: data })
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
      const result = await client
        .delete(`business/${businessId}/users/${userId}`)
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
};
