export type Role = 'PLATFORM_OWNER' | 'PLATFORM_ADMIN' | 'CLIENT';

interface BaseResponse {
  message: string;
  timestamp?: string;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  dateJoined: string;
  profilePicture?: string;
  phoneNumber?: string;
  role?: Role;
}

interface UserProfile extends UserPayload {
  dateJoined: string;
  emailConfirmed: boolean;
  twoFactorEnabled?: boolean;
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
  role?: Role;
}

export interface UserSummary extends UserPayload {
  dateJoined?: string;
  isBanned?: boolean;
}

export interface UsersListResponse {
  message?: string;
  users: UserSummary[];
}

export interface ChangeRoleResponse {
  message: string;
  userId: string;
  newRole: Role;
  previousRole?: Role;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: UserPayload;
}

export interface TwoFASetupResponse {
  qrCode: string;
  secret: string;
}

export interface TwoFAVerifyResponse {
  enabled: boolean;
}

export type TwoFALoginResponse = AuthResponseDto;

export interface TwoFactorRequiredResponse {
  tempToken: string;
  twoFactorRequired: true;
}

export type LoginResult = LoginResponse | TwoFactorRequiredResponse;

export interface AuthResponse extends BaseResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: UserPayload;
}

export interface RefreshTokenResponse extends BaseResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface RegisterSuccessResponse extends BaseResponse {
  email: string;
}

export type LogoutSuccessResponse = BaseResponse;

export interface FetchUserSuccessResponse extends BaseResponse {
  user: UserProfile;
}

export interface FetchUserByIdSuccessResponse extends BaseResponse {
  user: PublicUserProfile;
}

export interface UpdateUserSuccessResponse extends BaseResponse {
  user: UserProfile;
}

export type RegisterResponse = RegisterSuccessResponse;
export type LoginResponse = AuthResponse;
export type LogoutResponse = LogoutSuccessResponse;
export type FetchUserResponse = FetchUserSuccessResponse;
export type FetchUserByIdResponse = FetchUserByIdSuccessResponse;
export type UpdateUserResponse = UpdateUserSuccessResponse;
export type DeleteUserResponse = BaseResponse;
export type DeleteUserByAdminResponse = BaseResponse;
export type ForgotPasswordResponse = BaseResponse;
export type ResetPasswordResponse = BaseResponse;
export type ResendConfirmationResponse = BaseResponse;
export type ConfirmEmailResponse = BaseResponse;

export type BanUserResponse = BaseResponse;
export type UnbanUserResponse = BaseResponse;
export type TwoFADisableResponse = BaseResponse;

// OpenAPI compatibility aliases
export type RegistrationResponseDto = RegisterResponse;
export type RefreshResponseDto = RefreshTokenResponse;
export type UsersListResponseDto = UsersListResponse;
export type RoleResponseDto = ChangeRoleResponse;
export type BanResponseDto = BanUserResponse;
export type MessageResponseDto = BaseResponse;
