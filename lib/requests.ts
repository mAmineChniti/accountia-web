import { env } from '@/env';
import ky from 'ky';
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  FetchUserByIdInput,
  UpdateUserInput,
  ResendConfirmationInput,
  ForgotPasswordInput,
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
  HealthResponse,
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
      // Fallback to text for non-JSON responses
      const text = await response.text();
      return { message: text || 'Unknown error' };
    }
  } catch {
    // If even text() fails, return a generic error
    return { message: 'Failed to parse error response' };
  }
};

const API_CONFIG = {
  BASE_URL: (() => {
    const baseUrl = env.NEXT_PUBLIC_BACKEND ?? 'http://127.0.0.1:4789/api';
    return baseUrl.replace(/\/+$/, '') + '/';
  })(),
  AUTH: {
    REGISTER: 'auth/register',
    LOGIN: 'auth/login',
    LOGOUT: 'auth/logout',
    REFRESH: 'auth/refresh',
    FORGOT_PASSWORD: 'auth/forgot-password',
    RESET_PASSWORD: 'auth/reset-password',
    HEALTH: 'auth/health',
    PUBLIC_HEALTH: 'auth/public-health',
    FETCH_USER: 'auth/fetchuser',
    FETCH_USER_BY_ID: 'auth/fetchuserbyid',
    UPDATE: 'auth/update',
    DELETE: 'auth/delete',
    RESEND_CONFIRMATION: 'auth/resend-confirmation-email',
  },
} as const;

type TokenCookie = {
  token: string;
  refreshToken: string;
  expires_at: string;
  expires_at_ts: number;
};

const isTokenCookie = (v: unknown): v is TokenCookie =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Record<string, unknown>).token === 'string' &&
  typeof (v as Record<string, unknown>).refreshToken === 'string' &&
  typeof (v as Record<string, unknown>).expires_at === 'string' &&
  typeof (v as Record<string, unknown>).expires_at_ts === 'number';

const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : undefined;
  }

  return undefined;
};

const authHeaders = (): Record<string, string> => {
  const raw = getCookie('token');
  if (!raw || typeof raw !== 'string') return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isTokenCookie(parsed)) {
      const expMs =
        parsed.expires_at_ts > 1e12
          ? parsed.expires_at_ts
          : parsed.expires_at_ts * 1000;
      if (Date.now() >= expMs) return {};
      return { Authorization: `Bearer ${parsed.token}` };
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Failed to parse cookie 'token':`, error);
    }
  }

  if (raw.trim().length > 0) {
    return { Authorization: `Bearer ${raw}` };
  }
  return {};
};

const client = ky.create({
  prefixUrl: API_CONFIG.BASE_URL,
});

export const AuthService = {
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

  async login(data: LoginInput): Promise<LoginResponse> {
    try {
      const result = await client
        .post(API_CONFIG.AUTH.LOGIN, {
          json: data,
        })
        .json<LoginResponse>();
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
    const token = authHeaders();
    if (!token.Authorization) throw new Error('Token not found');

    const raw = getCookie('token');
    if (!raw || typeof raw !== 'string') throw new Error('Token not found');

    let refreshTokenValue: string | undefined;
    try {
      const parsed = JSON.parse(raw);
      if (isTokenCookie(parsed)) {
        refreshTokenValue = parsed.refreshToken;
      }
    } catch {
      // Try to decode and parse as fallback
      try {
        const decoded = decodeURIComponent(raw);
        const fallbackParsed = JSON.parse(decoded);
        if (isTokenCookie(fallbackParsed)) {
          refreshTokenValue = fallbackParsed.refreshToken;
        }
      } catch {
        // Leave undefined if all parsing attempts fail
      }
    }

    if (!refreshTokenValue) throw new Error('Refresh token not found');

    try {
      const result = await client
        .post(API_CONFIG.AUTH.REFRESH, {
          json: { refreshToken: refreshTokenValue },
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

  async healthCheck(): Promise<HealthResponse> {
    const token = authHeaders();
    if (!token.Authorization) throw new Error('Token not found');
    try {
      const result = await client
        .get(API_CONFIG.AUTH.HEALTH, {
          headers: token,
        })
        .json<HealthResponse>();
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

  async publicHealthCheck(): Promise<HealthResponse> {
    try {
      const result = await client
        .get(API_CONFIG.AUTH.PUBLIC_HEALTH)
        .json<HealthResponse>();
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
    const token = authHeaders();
    if (!token.Authorization) throw new Error('Token not found');
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
    const token = authHeaders();
    if (!token.Authorization) throw new Error('Token not found');
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
    const token = authHeaders();
    if (!token.Authorization) throw new Error('Token not found');
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
    const token = authHeaders();
    if (!token.Authorization) throw new Error('Token not found');
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
    const token = authHeaders();
    if (!token.Authorization) throw new Error('Token not found');
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
};
