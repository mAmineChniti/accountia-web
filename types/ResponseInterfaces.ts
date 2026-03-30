export type Role =
  | 'PLATFORM_OWNER'
  | 'PLATFORM_ADMIN'
  | 'BUSINESS_OWNER'
  | 'BUSINESS_ADMIN'
  | 'CLIENT';

interface BaseResponse {
  message: string;
  timestamp?: string;
}

interface PublicUserProfile {
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

interface UserProfile extends UserPayload {
  dateJoined: string;
  emailConfirmed: boolean;
  twoFactorEnabled?: boolean;
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
  role?: Role;
  dateJoined: string;
  isActive?: boolean;
  isBanned?: boolean;
  bannedReason?: string;
}

export interface UsersListResponse {
  message: string;
  users: UserSummary[];
}

export interface DeleteUserSuccessResponse extends BaseResponse {
  message: 'Account deactivated successfully';
}

export interface DeleteUserByAdminSuccessResponse extends BaseResponse {
  message: 'User deactivated successfully' | 'User reactivated successfully';
}

export interface ChangeRoleResponse extends BaseResponse {
  userId: string;
  newRole: Role;
  previousRole: Role;
}

export interface ForgotPasswordSuccessResponse extends BaseResponse {
  message: 'If an account exists with this email, a reset link will be sent';
}

export interface ResetPasswordSuccessResponse extends BaseResponse {
  message: 'Password reset successfully';
}

export interface ResendConfirmationSuccessResponse extends BaseResponse {
  message: string;
}

export type RegisterResponse = RegisterSuccessResponse;
export type LoginResponse = AuthResponse;
export type LogoutResponse = LogoutSuccessResponse;
export type FetchUserResponse = FetchUserSuccessResponse;
export type FetchUserByIdResponse = FetchUserByIdSuccessResponse;
export type UpdateUserResponse = UpdateUserSuccessResponse;
export type DeleteUserResponse = DeleteUserSuccessResponse;
export type DeleteUserByAdminResponse = DeleteUserByAdminSuccessResponse;
export type ForgotPasswordResponse = ForgotPasswordSuccessResponse;
export type ResetPasswordResponse = ResetPasswordSuccessResponse;
export type ResendConfirmationResponse = ResendConfirmationSuccessResponse;

export interface BusinessApplicationResponse {
  message: string;
  application: BusinessApplicationItem;
}

export interface BusinessItem {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  logo?: string;
  createdAt: string;
}

export interface BusinessDetailData {
  id: string;
  name: string;
  description: string;
  website?: string;
  phone: string;
  databaseName: string;
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  tags: string[];
  templateSettings: {
    currency: string;
    themeColor?: string;
    fontFamily?: string;
    companyName?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BusinessDetailResponse {
  message: string;
  business: BusinessDetailData;
}

export interface MyBusinessesResponse {
  message: string;
  businesses: BusinessItem[];
}

export interface AllBusinessesResponse {
  message: string;
  businesses: BusinessItem[];
}

export interface BusinessApplicationItem {
  id: string;
  businessName: string;
  description: string;
  website?: string;
  phone: string;
  applicantId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface BusinessApplicationsListResponse {
  message: string;
  applications: BusinessApplicationItem[];
}

export interface ReviewApplicationResponse {
  message: string;
  application: BusinessApplicationItem;
}

export interface AssignedBusinessUser {
  id: string;
  businessId: string;
  userId: string;
  role: string;
  assignedBy: string;
  isActive: boolean;
  createdAt: string;
}

export interface AssignUserResponse {
  message: string;
  businessUser: AssignedBusinessUser;
}

export interface BusinessMessageResponse {
  message: string;
}

export interface TwoFADisableResponse extends BaseResponse {
  disabled: boolean;
}

export interface BanUserResponse extends BaseResponse {
  userId: string;
  isBanned: boolean;
  reason?: string;
}

export type UnbanUserResponse = BanUserResponse;
