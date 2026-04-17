import {
  getTokenAllowExpired,
  setTokens,
  setUser,
  getUser,
} from '@/actions/cookies';
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
  GoogleOAuthExchangeInput,
} from '@/types/services';
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
  ConfirmEmailResponse,
  UsersListResponse,
  TwoFASetupResponse,
  TwoFAVerifyResponse,
  TwoFALoginResponse,
  ChangeRoleResponse,
  TwoFADisableResponse,
  BanUserResponse,
  UnbanUserResponse,
} from '@/types/services';
import {
  ApiError,
  createAuthenticatedClient,
  publicClient,
  API_CONFIG,
} from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

let refreshInFlightPromise: Promise<RefreshTokenResponse> | undefined;

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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
    }
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    if (refreshInFlightPromise) {
      return refreshInFlightPromise;
    }

    refreshInFlightPromise = (async () => {
      const tokenData = await getTokenAllowExpired();
      if (!tokenData?.refreshToken) {
        throw new ApiError('Refresh token not found', { statusCode: 401 });
      }

      const rawRefreshExpiry = tokenData.refresh_expires_at_ts;
      let refreshExpiryMs = rawRefreshExpiry;
      if (refreshExpiryMs && refreshExpiryMs < 1e12) {
        refreshExpiryMs = refreshExpiryMs * 1000;
      }

      if (refreshExpiryMs && refreshExpiryMs <= Date.now()) {
        throw new ApiError('Refresh token expired', { statusCode: 401 });
      }

      try {
        const result = await publicClient
          .post(API_CONFIG.AUTH.REFRESH, {
            headers: {
              Authorization: `Bearer ${tokenData.refreshToken}`,
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
        return handleServiceError(error);
      }
    })();

    try {
      return await refreshInFlightPromise;
    } finally {
      refreshInFlightPromise = undefined;
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
      return handleServiceError(error);
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
      return handleServiceError(error);
    }
  },

  async confirmEmail(token: string): Promise<ConfirmEmailResponse> {
    try {
      const endpoint = API_CONFIG.AUTH.CONFIRM_EMAIL.replace('{token}', token);
      const result = await publicClient
        .get(endpoint)
        .json<ConfirmEmailResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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

      // Update user cookie with new user data, preserving existing loginTime
      if (result.user) {
        const currentUser = await getUser();
        await setUser({
          userId: result.user.id,
          username: result.user.username,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          phoneNumber: result.user.phoneNumber,
          birthdate: result.user.birthdate,
          role: result.user.role ?? 'CLIENT',
          loginTime: currentUser?.loginTime ?? new Date().toISOString(),
        });
      }

      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
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

      // Update user cookie with new user data, preserving existing loginTime
      if (result.user) {
        const currentUser = await getUser();
        await setUser({
          userId: result.user.id,
          username: result.user.username,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          phoneNumber: result.user.phoneNumber,
          birthdate: result.user.birthdate,
          role: result.user.role ?? 'CLIENT',
          loginTime: currentUser?.loginTime ?? new Date().toISOString(),
        });
      }

      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
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
      return handleServiceError(error);
    }
  },

  async unbanUser(userId: string): Promise<UnbanUserResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.AUTH.UNBAN_USER.replace('{id}', userId);
      const result = await client.patch(endpoint).json<UnbanUserResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
