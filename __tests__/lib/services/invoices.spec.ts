import { InvoicesService } from '@/lib/services/invoices';
import { API_CONFIG } from '@/lib/api-config';
import { createAuthenticatedClient } from '@/lib/requests';

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

describe('InvoicesService', () => {
  const mockClient = createAuthenticatedClient() as {
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
        mockData as Parameters<typeof InvoicesService.createInvoice>[0]
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
});
