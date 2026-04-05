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
  isBanned?: boolean;
  bannedReason?: string;
}

export interface UsersListResponse {
  message: string;
  users: UserSummary[];
}

export interface DeleteUserSuccessResponse extends BaseResponse {
  message: 'Account deleted successfully';
}

export interface DeleteUserByAdminSuccessResponse extends BaseResponse {
  message: 'User deleted successfully';
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
  createdAt: string;
}

export interface BusinessDetailData {
  id: string;
  name: string;
  description: string;
  website?: string;
  phone: string;
  email: string;
  databaseName: string;
  status: 'pending' | 'approved' | 'rejected';
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

export interface BusinessUsersListResponse {
  message: string;
  users: AssignedBusinessUser[];
}

export interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface GetBusinessClientsResponse {
  message: string;
  clients: ClientData[];
}

export interface ChangeClientRoleResponse {
  message: string;
  businessUser: AssignedBusinessUser;
}

export interface BusinessMessageResponse {
  message: string;
}

export interface BusinessStatisticsResponse {
  businessId: string;
  businessName: string;
  products: {
    totalProducts: number;
    totalValue: number;
    lowStockProducts: number;
  };
  invoices: {
    totalInvoices: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
  };
  lastUpdated: string;
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

// ============= Invoices Types =============

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'VIEWED'
  | 'PAID'
  | 'PARTIAL'
  | 'OVERDUE'
  | 'DISPUTED'
  | 'VOIDED'
  | 'ARCHIVED';

export type InvoiceRecipientType =
  | 'PLATFORM_BUSINESS'
  | 'PLATFORM_INDIVIDUAL'
  | 'EXTERNAL';

export type RecipientResolutionStatus =
  | 'RESOLVED'
  | 'PENDING'
  | 'CLAIMED'
  | 'NEVER_RESOLVED';

export interface InvoiceLineItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  description?: string;
}

export interface InvoiceRecipientResponseDto {
  type: InvoiceRecipientType;
  platformId?: string;
  tenantDatabaseName?: string;
  email?: string;
  displayName?: string;
  resolutionStatus?: RecipientResolutionStatus;
  lastResolutionAttempt?: string;
}

export interface InvoiceResponse extends BaseResponse {
  id: string;
  issuerBusinessId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: number;
  currency: string;
  amountPaid: number;
  issuedDate: string;
  dueDate: string;
  description?: string;
  paymentTerms?: string;
  recipient: InvoiceRecipientResponseDto;
  lineItems: InvoiceLineItemResponseDto[];
  createdBy?: string;
  lastModifiedBy?: string;
  lastStatusChangeAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListResponse extends BaseResponse {
  invoices: InvoiceResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvoiceReceiptResponseDto {
  id: string;
  invoiceId: string;
  issuerTenantDatabaseName: string;
  issuerBusinessId: string;
  issuerBusinessName: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  issuedDate: string;
  dueDate: string;
  invoiceStatus: InvoiceStatus;
  recipientViewed: boolean;
  recipientViewedAt?: string;
  lastSyncedAt: string;
  createdAt: string;
}

export interface ReceivedInvoiceListResponse extends BaseResponse {
  receipts: InvoiceReceiptResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Legacy invoice types (kept for backward compatibility)

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  unitPrice: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductResponse extends BaseResponse {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  unitPrice: number;
  currency: string;
  createdAt: string;
}

export interface ProductListResponse extends BaseResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductDetailResponse extends BaseResponse {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  unitPrice: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProductResponse extends BaseResponse {
  id: string;
  name: string;
  unitPrice: number;
  currency: string;
  updatedAt?: string;
}

export interface ProductImportResponse extends BaseResponse {
  imported: number;
  failed: number;
  skipped: number;
}

export interface ProductMessageResponse extends BaseResponse {
  message: string;
}

export interface LineItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  total?: number;
}

export interface PersonalInvoice {
  id: string;
  businessId: string;
  clientUserId: string;
  amount: number;
  status?: 'DRAFT' | 'SENT' | 'PENDING' | 'PAID' | 'OVERDUE';
  paid: boolean;
  paidAt?: string;
  issuedAt: string;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PersonalInvoiceDetail extends PersonalInvoice {
  lineItems: LineItem[];
}

export interface CreatePersonalInvoiceResponse extends BaseResponse {
  id: string;
  businessId: string;
  clientUserId: string;
  amount: number;
  issuedAt: string;
  dueDate: string;
  paid: boolean;
  createdAt: string;
}

export interface PersonalInvoiceListResponse extends BaseResponse {
  invoices: PersonalInvoice[];
  total: number;
  page: number;
  limit: number;
}

export interface PersonalInvoiceDetailResponse extends BaseResponse {
  id: string;
  businessId: string;
  clientUserId: string;
  lineItems: LineItem[];
  amount: number;
  issuedAt: string;
  dueDate: string;
  paid: boolean;
  paidAt?: string;
}

export interface UpdatePersonalInvoiceResponse extends BaseResponse {
  id: string;
  businessId: string;
  clientUserId: string;
  lineItems?: LineItem[];
  amount: number;
  issuedAt: string;
  dueDate: string;
  paid: boolean;
  paidAt?: string;
}

export interface CompanyInvoice {
  id: string;
  businessId: string;
  clientBusinessId: string;
  clientCompanyName: string;
  clientContactEmail: string;
  amount: number;
  status?: 'DRAFT' | 'SENT' | 'PENDING' | 'PAID' | 'OVERDUE';
  paid: boolean;
  paidAt?: string;
  issuedAt: string;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyInvoiceDetail extends CompanyInvoice {
  lineItems: LineItem[];
}

export interface CreateCompanyInvoiceResponse extends BaseResponse {
  id: string;
  businessId: string;
  clientBusinessId: string;
  clientCompanyName: string;
  amount: number;
  issuedAt: string;
  dueDate: string;
  paid: boolean;
  createdAt: string;
}

export interface CompanyInvoiceListResponse extends BaseResponse {
  invoices: CompanyInvoice[];
  total: number;
  page: number;
  limit: number;
}

export interface CompanyInvoiceDetailResponse extends BaseResponse {
  id: string;
  businessId: string;
  clientBusinessId: string;
  clientCompanyName: string;
  clientContactEmail: string;
  amount: number;
  lineItems: LineItem[];
  issuedAt: string;
  dueDate: string;
  paid: boolean;
  paidAt?: string;
}

export interface UpdateCompanyInvoiceResponse extends BaseResponse {
  id: string;
  businessId: string;
  clientBusinessId: string;
  clientCompanyName: string;
  clientContactEmail: string;
  amount: number;
  lineItems?: LineItem[];
  issuedAt: string;
  dueDate: string;
  paid: boolean;
  paidAt?: string;
}

export interface InvoiceImportResponse extends BaseResponse {
  imported: number;
  failed: number;
  message: string;
}

export interface InvoiceMessageResponse extends BaseResponse {
  message: string;
}

export interface TenantMetadata {
  businessId: string;
  databaseName: string;
}

export interface TenantMetadataResponse extends BaseResponse {
  tenant: TenantMetadata;
  metadata: {
    invoicesCount: number;
    activeClients: number;
    lastModified: string;
  };
}

// ============= Chat Endpoints =============

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessageResponse extends BaseResponse {
  response: string;
}

// ============= Notifications Endpoints =============

export type NotificationType =
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.viewed'
  | 'invoice.overdue'
  | 'business.approved'
  | 'business.rejected'
  | 'user.added'
  | 'user.removed'
  | string;

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  payload?: Record<string, unknown>;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ============= Audit Endpoints =============

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  userRole: Role;
  target: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface AuditLogListResponse extends BaseResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============= Health Check =============

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
}
