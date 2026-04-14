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

export interface InvoiceResponse {
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

export interface InvoiceListResponse {
  invoices: InvoiceResponse[];
  total: number;
  filteredTotal: number;
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

export interface ReceivedInvoiceListResponse {
  receipts: InvoiceReceiptResponseDto[];
  total: number;
  filteredTotal: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BulkImportResultItem {
  invoiceNumber?: string;
  invoiceId?: string;
  status: 'success' | 'error' | 'warning';
  message?: string;
  warnings?: string[];
  lineItemsCount?: number;
  totalAmount?: number;
}

export interface BulkImportInvoicesResponseDto {
  totalRecords: number;
  successCount: number;
  failedCount: number;
  warningCount: number;
  results: BulkImportResultItem[];
  generalErrors?: string[];
  importStartedAt?: string;
  importCompletedAt?: string;
  processingTimeMs?: number;
}

export type InvoiceResponseDto = InvoiceResponse;

export type InvoiceListResponseDto = InvoiceListResponse;

export interface InvoiceReceiptListResponseDto {
  receipts: InvoiceReceiptResponseDto[];
  total: number;
  filteredTotal: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ImportTemplateResponseDto {
  [key: string]: unknown;
}
