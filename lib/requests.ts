import { env } from '@/env';
import ky from 'ky';
import { getToken } from '@/actions/cookies';
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

const authHeaders = async (): Promise<Record<string, string>> => {
  const tokenData = await getToken();
  if (!tokenData) return {};

  return { Authorization: `Bearer ${tokenData.token}` };
};

const client = ky.create({
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .post(API_CONFIG.AUTH.TWO_FA_SETUP, {
          headers: token,
        })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .post(API_CONFIG.AUTH.TWO_FA_VERIFY, {
          json: data,
          headers: token,
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
      const result = await client
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
      const result = await client
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
      const result = await client
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
      const result = await client
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .post(API_CONFIG.AUTH.LOGOUT, {
          json: { refreshToken },
          headers: token,
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }

    try {
      const result = await client
        .post(API_CONFIG.AUTH.REFRESH, {
          headers: token,
        })
        .json<RefreshTokenResponse>();
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
      const result = await client
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
      const result = await client
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .get(API_CONFIG.AUTH.FETCH_USER, {
          headers: token,
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

  async fetchUserWithAccessToken(
    accessToken: string
  ): Promise<FetchUserResponse> {
    if (!accessToken) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }

    try {
      const result = await client
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .post(API_CONFIG.AUTH.FETCH_USER_BY_ID, {
          json: data,
          headers: token,
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .put(API_CONFIG.AUTH.UPDATE, {
          json: data,
          headers: token,
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .patch(API_CONFIG.AUTH.UPDATE, {
          json: data,
          headers: token,
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .delete(API_CONFIG.AUTH.DELETE, {
          headers: token,
        })
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
      const result = await client
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }

    try {
      const result = await client
        .get(API_CONFIG.AUTH.FETCH_ALL_USERS, {
          headers: token,
        })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }

    try {
      const result = await client
        .delete(`${API_CONFIG.AUTH.DELETE_USER_BY_ADMIN}/${userId}`, {
          headers: token,
        })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }

    try {
      const result = await client
        .patch(API_CONFIG.AUTH.CHANGE_ROLE, {
          json: data,
          headers: token,
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .post(API_CONFIG.AUTH.TWO_FA_DISABLE, { json: data, headers: token })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const endpoint = API_CONFIG.AUTH.BAN_USER.replace('{userId}', userId);
      const result = await client
        .patch(endpoint, { headers: token })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const endpoint = API_CONFIG.AUTH.UNBAN_USER.replace('{userId}', userId);
      const result = await client
        .patch(endpoint, { headers: token })
        .json<UnbanUserResponse>();
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .post('business/apply', { json: data, headers: token })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .get('business/applications', { headers: token })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .post(`business/applications/${id}/review`, {
          json: data,
          headers: token,
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .get('business/my', { headers: token })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .get('business/all', { headers: token })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .get(`business/${id}`, { headers: token })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .put(`business/${id}`, { json: data, headers: token })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .delete(`business/${id}`, { headers: token })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .post(`business/${businessId}/users`, { json: data, headers: token })
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
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }
    try {
      const result = await client
        .delete(`business/${businessId}/users/${userId}`, { headers: token })
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
