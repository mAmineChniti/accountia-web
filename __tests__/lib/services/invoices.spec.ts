import { InvoicesService } from '@/lib/services/invoices';
import { API_CONFIG } from '@/lib/api-config';
import { createAuthenticatedClient } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_BACKEND: 'http://localhost:4789/api',
  },
}));

jest.mock('@/lib/requests', () => {
  const mockClient = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
  return {
    createAuthenticatedClient: jest.fn(() => mockClient),
    API_CONFIG: jest.requireActual('@/lib/api-config').API_CONFIG,
  };
});

jest.mock('@/lib/services/service-error', () => ({
  handleServiceError: jest.fn(),
}));

describe('InvoicesService', () => {
  const mockClient = createAuthenticatedClient() as unknown as {
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listIssuedInvoices', () => {
    it('should fetch issued invoices with pagination', async () => {
      const mockRes = { items: [], total: 0 };
      mockClient.get.mockReturnValue({
        json: jest.fn().mockResolvedValue(mockRes),
      });

      const res = await InvoicesService.listIssuedInvoices({
        page: 1,
        limit: 10,
        businessId: 'b1',
      });
      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.INVOICES.LIST_ISSUED,
        expect.objectContaining({
          searchParams: { page: 1, limit: 10, businessId: 'b1' },
        })
      );
      expect(res).toEqual(mockRes);
    });
  });

  describe('createInvoice', () => {
    it('should post invoice data', async () => {
      const mockData = { amount: 100, clientId: 'c1', businessId: 'b1' };
      mockClient.post.mockReturnValue({
        json: jest.fn().mockResolvedValue({ id: 'i1' }),
      });

      await InvoicesService.createInvoice(
        mockData as unknown as Parameters<
          typeof InvoicesService.createInvoice
        >[0]
      );
      expect(mockClient.post).toHaveBeenCalledWith(
        API_CONFIG.INVOICES.CREATE,
        expect.objectContaining({
          json: mockData,
        })
      );
    });
  });

  describe('getIssuedInvoice', () => {
    it('should fetch invoice details', async () => {
      mockClient.get.mockReturnValue({
        json: jest.fn().mockResolvedValue({ id: 'i1' }),
      });

      await InvoicesService.getIssuedInvoice('i1', 'b1');
      const expectedUrl = API_CONFIG.INVOICES.GET_ISSUED.replace('{id}', 'i1');
      expect(mockClient.get).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          searchParams: { businessId: 'b1' },
        })
      );
    });
  });

  describe('importInvoiceFromDocument', () => {
    it('should post the document with businessId', async () => {
      const file = new File(['pdf'], 'invoice.pdf', {
        type: 'application/pdf',
      });
      const mockResponse = { id: 'i1' };
      mockClient.post.mockReturnValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await InvoicesService.importInvoiceFromDocument(
        file,
        'b1'
      );

      expect(mockClient.post).toHaveBeenCalledWith(
        API_CONFIG.INVOICES.IMPORT_DOCUMENT,
        expect.objectContaining({
          searchParams: { businessId: 'b1' },
          body: expect.any(FormData),
        })
      );
      const body = mockClient.post.mock.calls[0][1].body as FormData;
      expect(body.get('file')).toBe(file);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors from the client', async () => {
      const file = new File(['pdf'], 'invoice.pdf', {
        type: 'application/pdf',
      });
      const mockError = new Error('boom');
      const handledError = { error: 'handled' };
      mockClient.post.mockImplementation(() => {
        throw mockError;
      });
      (handleServiceError as jest.Mock).mockReturnValue(handledError);

      const result = await InvoicesService.importInvoiceFromDocument(
        file,
        'b1'
      );

      expect(handleServiceError).toHaveBeenCalledWith(mockError);
      expect(result).toEqual(handledError);
    });
  });
});
