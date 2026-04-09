import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  TransitionInvoiceInput,
} from '@/types/services';
import type {
  InvoiceResponse,
  InvoiceListResponse,
  ReceivedInvoiceListResponse,
  ImportTemplateResponseDto,
  BulkImportInvoicesResponseDto,
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
    data: UpdateInvoiceInput
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.INVOICES.UPDATE_ISSUED.replace(
        '{id}',
        encodeURIComponent(id)
      );
      const result = await client
        .patch(endpoint, { json: data })
        .json<InvoiceResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // 5. Transition Invoice State
  async transitionInvoice(
    id: string,
    data: TransitionInvoiceInput
  ): Promise<InvoiceResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.INVOICES.TRANSITION.replace(
        '{id}',
        encodeURIComponent(id)
      );
      const result = await client
        .post(endpoint, { json: data })
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

  // 10. Get Invoice Import Template
  async getImportTemplate(
    businessId: string
  ): Promise<ImportTemplateResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(API_CONFIG.INVOICES.IMPORT_TEMPLATE, { searchParams })
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
};
