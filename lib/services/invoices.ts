import type {
  CreateInvoiceInput,
  CreateInvoiceCheckoutSessionInput,
  MockInvoicePaymentInput,
  UpdateInvoiceInput,
  TransitionInvoiceInput,
} from '@/types/services';
import type {
  InvoiceResponse,
  InvoiceListResponse,
  ReceivedInvoiceListResponse,
  InvoiceCheckoutSessionResponse,
  ImportTemplateResponseDto,
  BulkImportInvoicesResponseDto,
  InvoiceImportJobResponseDto,
} from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';

import { handleServiceError } from '@/lib/services/service-error';

export const InvoicesService = {
  // ============= ISSUER ENDPOINTS =============

  // 1. Create Invoice (Draft)
  async createInvoice(data: CreateInvoiceInput): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.INVOICES.CREATE, { json: data })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 2. List Issued Invoices
  async listIssuedInvoices(params?: {
    businessId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<InvoiceListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      };
      if (params?.businessId) searchParams.businessId = params.businessId;
      if (params?.status) searchParams.status = params.status;
      const result = await client
        .get(API_CONFIG.INVOICES.LIST_ISSUED, { searchParams })
        .json<InvoiceListResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 3. Get Single Issued Invoice
  async getIssuedInvoice(
    id: string,
    businessId: string
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {
        businessId,
      };
      const endpoint = API_CONFIG.INVOICES.GET_ISSUED.replace(
        '{id}',
        encodeURIComponent(id)
      );
      const result = await client
        .get(endpoint, { searchParams })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 4. Update Draft Invoice
  async updateInvoice(
    id: string,
    businessId: string,
    data: UpdateInvoiceInput
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.INVOICES.UPDATE_ISSUED.replace(
        '{id}',
        encodeURIComponent(id)
      );
      const payload = {
        ...data,
        businessId,
      };
      const result = await client
        .patch(endpoint, { json: payload })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 5. Transition Invoice State
  async transitionInvoice(
    id: string,
    businessId: string,
    data: TransitionInvoiceInput
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.INVOICES.TRANSITION.replace(
        '{id}',
        encodeURIComponent(id)
      );
      const payload = {
        ...data,
        businessId,
      };
      const result = await client
        .post(endpoint, { json: payload })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // ============= RECIPIENT ENDPOINTS =============

  // 6. Get Invoices Received by Business
  async getReceivedInvoicesByBusiness(params?: {
    businessId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ReceivedInvoiceListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      };
      if (params?.status) searchParams.status = params.status;
      if (params?.businessId) searchParams.businessId = params.businessId;
      const result = await client
        .get(API_CONFIG.INVOICES.LIST_RECEIVED_BUSINESS, { searchParams })
        .json<ReceivedInvoiceListResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 7. Get Invoices Received by Individual
  async getReceivedInvoicesByIndividual(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ReceivedInvoiceListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      };
      if (params?.status) searchParams.status = params.status;
      const result = await client
        .get(API_CONFIG.INVOICES.LIST_RECEIVED_INDIVIDUAL, { searchParams })
        .json<ReceivedInvoiceListResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 8. Get Full Invoice Details (Business Recipient)
  async getReceivedInvoiceDetails(
    receiptId: string,
    businessId: string
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {
        businessId,
      };
      const endpoint = API_CONFIG.INVOICES.GET_RECEIVED_DETAILS.replace(
        '{receiptId}',
        encodeURIComponent(receiptId)
      );
      const result = await client
        .get(endpoint, { searchParams })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 9. Get Full Invoice Details (Individual Recipient)
  async getReceivedIndividualInvoiceDetails(
    receiptId: string,
    businessId?: string
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {};
      if (businessId) searchParams.businessId = businessId;
      const endpoint =
        API_CONFIG.INVOICES.GET_RECEIVED_INDIVIDUAL_DETAILS.replace(
          '{receiptId}',
          encodeURIComponent(receiptId)
        );
      const result = await client
        .get(endpoint, { searchParams })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async createIndividualCheckoutSession(
    receiptId: string,
    payload?: CreateInvoiceCheckoutSessionInput
  ): Promise<InvoiceCheckoutSessionResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.INVOICES.CREATE_INDIVIDUAL_CHECKOUT.replace(
        '{receiptId}',
        encodeURIComponent(receiptId)
      );
      const result = await client
        .post(endpoint, { json: payload ?? {} })
        .json<InvoiceCheckoutSessionResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async createIndividualMockPayment(
    receiptId: string,
    payload: MockInvoicePaymentInput
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint =
        API_CONFIG.INVOICES.CREATE_INDIVIDUAL_MOCK_PAYMENT.replace(
          '{receiptId}',
          encodeURIComponent(receiptId)
        );
      const result = await client
        .post(endpoint, { json: payload })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 10. Get Invoice Import Template
  async getImportTemplate(): Promise<ImportTemplateResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(API_CONFIG.INVOICES.IMPORT_TEMPLATE)
        .json<ImportTemplateResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 11. Import Invoices from File
  async importInvoices(
    file: File,
    businessId: string
  ): Promise<BulkImportInvoicesResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const formData = new FormData();
      formData.append('file', file);
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .post(API_CONFIG.INVOICES.IMPORT, { body: formData, searchParams })
        .json<BulkImportInvoicesResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 12. Import Invoice from PDF (AI)
  async importInvoicePdf(
    file: File,
    businessId: string
  ): Promise<{ jobId: string }> {
    const client = createAuthenticatedClient();
    try {
      const formData = new FormData();
      formData.append('file', file);
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .post(API_CONFIG.INVOICES.IMPORT_PDF, { body: formData, searchParams })
        .json<{ jobId: string }>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 13. Get PDF Import Job Status
  async getImportJobStatus(
    jobId: string,
    businessId: string
  ): Promise<InvoiceImportJobResponseDto> {
    const client = createAuthenticatedClient();
    const searchParams: Record<string, string> = { businessId };
    const endpoint = API_CONFIG.INVOICES.GET_IMPORT_JOB.replace(
      '{id}',
      encodeURIComponent(jobId)
    );

    try {
      const result = await client
        .get(endpoint, { searchParams })
        .json<InvoiceImportJobResponseDto>();
      return result;
    } catch (error: unknown) {
      // Enhanced diagnostic logging for debugging polling issues
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4789/api';
      const fullUrl = `${baseUrl}/${endpoint}?businessId=${businessId}`;

      // Safely access response for diagnostic logging
      const response =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as
              | {
                  status?: number;
                  statusText?: string;
                  json: () => Promise<unknown>;
                }
              | undefined)
          : undefined;

      console.error(`[InvoicesService] Polling Failure Diagnostics:`, {
        url: fullUrl,
        status: response?.status,
        statusText: response?.statusText,
      });

      if (response) {
        try {
          const body = await response.json();
          console.error(`[InvoicesService] Error Response Body:`, body);
        } catch {
          console.error(
            `[InvoicesService] Error Response could not be parsed as JSON`
          );
        }
      }

      return handleServiceError(error);
    }
  },
};
