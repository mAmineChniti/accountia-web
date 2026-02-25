import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  UpdateUserInput,
} from '@/types/RequestSchemas';

export interface BaseResponse {
  message: string;
  timestamp?: string;
}

export interface BaseErrorResponse {
  message: string;
  statusCode?: number;
  timestamp?: string;
}

export interface ValidationErrorResponse {
  message: string;
  errors: Record<string, string>;
}

export interface UserPayload {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  birthdate?: string;
  profilePicture?: string;
  isAdmin: boolean;
}

export interface UserProfile extends UserPayload {
  dateJoined: string;
  emailConfirmed: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    birthdate?: string;
    profilePicture?: string;
    isAdmin: boolean;
  };
}

export interface TwoFASetupResponse {
  qrCode: string;
  secret: string;
}

export interface TwoFAVerifyResponse {
  enabled: boolean;
}

export type TwoFALoginResponse = AuthResponseDto;

export interface RegistrationResponseDto {
  message: string;
  email: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ResendConfirmationDto {
  email: string;
}

export interface AuthResponse extends BaseResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: UserPayload;
}

export interface RegisterSuccessResponse extends BaseResponse {
  email: string;
}

export interface EmailNotConfirmedResponse extends BaseErrorResponse {
  type: 'EMAIL_NOT_CONFIRMED';
  email: string;
  userId: string;
}

export interface AccountExistsResponse extends BaseErrorResponse {
  type: 'ACCOUNT_EXISTS';
}

export interface InvalidCredentialsResponse extends BaseErrorResponse {
  statusCode: 401;
  type: 'INVALID_CREDENTIALS';
  message: 'Invalid email or password';
}

export interface AccountLockedResponse extends BaseErrorResponse {
  statusCode: 403;
  type: 'ACCOUNT_LOCKED';
  message: 'Account is temporarily locked due to too many failed attempts';
}

export interface AccountDeactivatedResponse extends BaseErrorResponse {
  statusCode: 403;
  type: 'ACCOUNT_DEACTIVATED';
  message: 'Account is deactivated';
}

export interface EmailNotConfirmedLoginResponse extends BaseErrorResponse {
  statusCode: 403;
  type: 'EMAIL_NOT_CONFIRMED';
  message: 'Email not confirmed. Please confirm your email before logging in.';
}

export interface RateLimitResponse extends BaseErrorResponse {
  statusCode: 429;
  type: 'RATE_LIMITED';
  message: 'Too many failed login attempts. Please try again later.';
}

/**
 * LogoutSuccessResponse is intentionally left empty as a successful logout returns 200 OK with an empty body.
 */
export interface LogoutSuccessResponse {} // eslint-disable-line @typescript-eslint/no-empty-object-type

export interface LogoutErrorResponse extends BaseErrorResponse {
  statusCode: 401;
  type: 'UNAUTHORIZED';
  message: 'Unauthorized';
}

export interface InvalidRefreshTokenResponse extends BaseErrorResponse {
  statusCode: 401;
  type: 'INVALID_REFRESH_TOKEN';
  message: 'Invalid refresh token';
}

export interface RefreshTokenExpiredResponse extends BaseErrorResponse {
  statusCode: 401;
  type: 'REFRESH_TOKEN_EXPIRED';
  message: 'Refresh token has expired';
}

export interface FetchUserSuccessResponse extends BaseResponse {
  user: UserProfile;
}

export interface FetchUserByIdSuccessResponse extends BaseResponse {
  user: UserProfile;
}

export interface FetchUserByIdRequestBody {
  userId: string;
}

// administrative user summary/list types
export interface UserSummary {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  profilePicture?: string;
  phoneNumber?: string;
  isAdmin: boolean;
  dateJoined: string;
}

export interface UsersListResponse {
  message: string;
  users: UserSummary[];
}

export interface UpdateUserSuccessResponse extends BaseResponse {
  user: UserProfile;
}

export interface UsernameTakenResponse extends BaseErrorResponse {
  type: 'USERNAME_TAKEN';
  message: 'Username is already taken';
}

export interface EmailAlreadyRegisteredResponse extends BaseErrorResponse {
  type: 'EMAIL_ALREADY_REGISTERED';
  message: 'Email is already registered';
}

export interface DeleteUserSuccessResponse extends BaseResponse {
  message: 'Account deleted successfully';
}

export interface ForgotPasswordSuccessResponse extends BaseResponse {
  message: 'If an account exists with this email, a reset link will be sent';
}

export interface ForgotPasswordRequestBody {
  email: string; // Required, valid email
}

export interface ResetPasswordSuccessResponse extends BaseResponse {
  message: 'Password reset successfully';
}

export interface ResetPasswordRequestBody {
  token: string; // Required, reset token
  newPassword: string; // Required, new password
}

export interface ResendConfirmationSuccessResponse extends BaseResponse {
  message: string;
}

export interface EmailAlreadyConfirmedResponse extends BaseErrorResponse {
  type: 'EMAIL_ALREADY_CONFIRMED';
  message: 'Email is already confirmed';
}

export type RegisterResponse = RegisterSuccessResponse;
export type LoginResponse = AuthResponse;
export type LogoutResponse = LogoutSuccessResponse;
export type RefreshTokenResponse = AuthResponse;
export type FetchUserResponse = FetchUserSuccessResponse;
export type FetchUserByIdResponse = FetchUserByIdSuccessResponse;
export type UpdateUserResponse = UpdateUserSuccessResponse;
export type DeleteUserResponse = DeleteUserSuccessResponse;
export type ForgotPasswordResponse = ForgotPasswordSuccessResponse;
export type ResetPasswordResponse = ResetPasswordSuccessResponse;
export type ResendConfirmationResponse = ResendConfirmationSuccessResponse;
export type FetchAllUsersResponse = UsersListResponse;

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

export interface TokenExpiryInfo {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  ACCOUNT_EXISTS = 'ACCOUNT_EXISTS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',
  RATE_LIMITED = 'RATE_LIMITED',
  USERNAME_TAKEN = 'USERNAME_TAKEN',
  EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
}

export type ApiResponse<T> = T & BaseResponse;

export type ApiError = BaseErrorResponse | ValidationErrorResponse;

export type SuccessResponse<T> = ApiResponse<T>;

export type ErrorResponse = ApiError;

// Re-export Zod-inferred types as canonical request body types
export type RegisterRequestBody = RegisterInput;
export type LoginRequestBody = LoginInput;
export type LogoutRequestBody = RefreshTokenInput;
export type UpdateUserRequestBody = UpdateUserInput;
