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
      VENDORS: {
        CREATE: 'vendors',
        LIST: 'vendors',
        GET: 'vendors/{id}',
        UPDATE: 'vendors/{id}',
        DELETE: 'vendors/{id}',
      },
    },
  };
});

import { VendorsService } from '@/lib/services/vendors';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('VendorsService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('createVendor', () => {
    it('should create a vendor', async () => {
      const mockData = { name: 'Vendor 1', email: 'v1@ex.com' };
      const mockResponse = { id: 'v1', ...mockData };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await VendorsService.createVendor(mockData as any);

      expect(mockClient.post).toHaveBeenCalledWith(API_CONFIG.VENDORS.CREATE, {
        json: mockData,
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
