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
} from '@/types/RequestSchemas';
import type {
  RegisterResponse,
  LoginResponse,
  LogoutResponse,
  RefreshTokenResponse,
  FetchUserResponse,
  FetchUserByIdResponse,
  UpdateUserResponse,
  DeleteUserResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  ResendConfirmationResponse,
  UsersListResponse,
  TwoFASetupResponse,
  TwoFAVerifyResponse,
  TwoFALoginResponse,
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
    TWO_FA_SETUP: 'auth/2fa/setup',
    TWO_FA_VERIFY: 'auth/2fa/verify',
    TWO_FA_LOGIN: 'auth/2fa/login',
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

  async login(
    data: LoginInput
  ): Promise<
    LoginResponse | { tempToken: string; twoFactorRequired: boolean }
  > {
    try {
      const result = await client
        .post(API_CONFIG.AUTH.LOGIN, {
          json: data,
        })
        .json<
          LoginResponse | { tempToken: string; twoFactorRequired: boolean }
        >();
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

  async deleteUserByAdmin(userId: string): Promise<DeleteUserResponse> {
    const token = await authHeaders();
    if (!token.Authorization) {
      throw new ApiError('Token not found', { statusCode: 401 });
    }

    try {
      const result = await client
        .delete(`${API_CONFIG.AUTH.DELETE_USER_BY_ADMIN}/${userId}`, {
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
};
