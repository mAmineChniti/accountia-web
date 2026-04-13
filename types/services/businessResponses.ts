export interface BusinessItem {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
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
  businessEmail: string;
  applicantId: string;
  applicantEmail?: string;
  applicantName?: string;
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

export type BusinessApplicationResponse = ReviewApplicationResponse;

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

export interface OtherBusiness {
  id: string;
  name: string;
  email: string;
}

export interface GetOtherBusinessesResponse {
  message: string;
  businesses: OtherBusiness[];
}

export interface ChangeClientRoleResponse {
  message: string;
  businessUser: AssignedBusinessUser;
}

export interface BusinessMessageResponse {
  message: string;
}

export interface BusinessInvite {
  id: string;
  businessId: string;
  invitedEmail: string;
  inviterId: string;
  businessRole: string;
  emailSent: boolean;
  createdAt: string;
}

export interface BusinessInviteResponseDto {
  message: string;
  invite: BusinessInvite;
}

export interface MonthlyDataPointDto {
  date: string;
  value: number;
}

export interface TimeSeriesDataDto {
  historical: MonthlyDataPointDto[];
  predicted: MonthlyDataPointDto[];
}

export interface ProductStatsDto {
  productId: string;
  productName: string;
  unitPrice: number;
  unitCost: number;
  soldQuantity: number;
  revenue: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPercent: number;
}

export interface BusinessStatisticsResponse {
  message: string;
  businessId: string;
  period: {
    start: string;
    end: string;
  };
  kpis: {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    netProfit: number;
    profitMarginPercent: number;
  };
  revenueTimeSeries: {
    revenue: TimeSeriesDataDto;
    cogs: TimeSeriesDataDto;
    grossProfit: TimeSeriesDataDto;
    salesVolume: TimeSeriesDataDto;
  };
  invoiceStatistics: {
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  };
  productStatistics: {
    totalProducts: number;
    totalInventoryValue: number;
    lowStockProducts: number;
  };
  salesAnalytics: {
    salesVolume: TimeSeriesDataDto;
    topProducts: ProductStatsDto[];
    underperformingProducts: ProductStatsDto[];
    salesTrend: 'growth' | 'decline' | 'stagnation';
  };
}

export interface ClientPodiumItem {
  clientId: string;
  clientName: string;
  clientEmail: string;
  totalPaidAmount: number;
  totalPaidInvoices: number;
  medal: string;
}

export interface ClientPodiumResponse {
  businessId: string;
  podium: ClientPodiumItem[];
}

export interface TenantMetadata {
  businessId: string;
  databaseName: string;
}

export interface TenantMetadataResponse extends Record<string, unknown> {
  tenant: TenantMetadata;
  metadata: {
    invoicesCount: number;
    activeClients: number;
    lastModified: string;
  };
}

export interface TenantMetadataData {
  businessId: string;
  databaseName: string;
}

export interface TenantMetadataDetailsDto {
  invoicesCount: number;
  activeClients: number;
  lastModified: string;
}

// OpenAPI compatibility aliases
export type BusinessApplicationResponseDto = BusinessApplicationResponse;
export type BusinessApplicationListResponseDto =
  BusinessApplicationsListResponse;
export type BusinessesListResponseDto = AllBusinessesResponse;
export type BusinessResponseDto = BusinessDetailResponse;
export type BusinessUserResponseDto = AssignUserResponse;
export type BusinessStatisticsResponseDto = BusinessStatisticsResponse;
