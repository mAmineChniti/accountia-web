/* eslint-disable */
jest.mock('@/lib/requests', () => {
  const mockMethod = () => jest.fn();
  return {
    publicClient: {
      post: mockMethod(),
      get: mockMethod(),
      put: mockMethod(),
      patch: mockMethod(),
      delete: mockMethod(),
    },
    createAuthenticatedClient: jest.fn(),
    API_CONFIG: {
      INVOICES: {
        CREATE: 'invoices',
        LIST_ISSUED: 'invoices/issued',
        LIST_RECEIVED: 'invoices/received',
        GET_BY_ID: 'invoices/{id}',
        UPDATE: 'invoices/{id}',
        DELETE: 'invoices/{id}',
        MARK_AS_PAID: 'invoices/{id}/paid',
        DOWNLOAD: 'invoices/{id}/download',
        STATISTICS: 'invoices/statistics',
      },
    },
  };
});

import { InvoicesService } from '@/lib/services/invoices';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('InvoicesService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('createInvoice', () => {
    it('should create an invoice on success', async () => {
      const mockData = { total: 100, items: [] };
      const mockResponse = { id: 'inv1', ...mockData };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await InvoicesService.createInvoice(mockData as any);

      expect(mockClient.post).toHaveBeenCalledWith(API_CONFIG.INVOICES.CREATE, {
        json: mockData,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listIssuedInvoices', () => {
    it('should list invoices with default pagination', async () => {
      const mockResponse = { data: [], total: 0 };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await InvoicesService.listIssuedInvoices();

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.INVOICES.LIST_ISSUED,
        {
          searchParams: { page: 1, limit: 10 },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should use provided status and businessId', async () => {
      const mockResponse = { data: [], total: 0 };
      mockClient.json.mockResolvedValue(mockResponse);

      await InvoicesService.listIssuedInvoices({
        status: 'PAID',
        businessId: 'b1',
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.INVOICES.LIST_ISSUED,
        {
          searchParams: {
            page: 1,
            limit: 10,
            status: 'PAID',
            businessId: 'b1',
          },
        }
      );
    });
  });
});
