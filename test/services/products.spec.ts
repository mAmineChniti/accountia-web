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
      PRODUCTS: {
        CREATE: 'products',
        LIST: 'products',
        GET: 'products/{id}',
        UPDATE: 'products/{id}',
        DELETE: 'products/{id}',
      },
    },
  };
});

import { ProductsService } from '@/lib/services/products';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('ProductsService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('getProducts', () => {
    it('should fetch products with pagination', async () => {
      const mockResponse = { products: [], total: 0 };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await ProductsService.getProducts(1, 10, 'b1');

      expect(mockClient.get).toHaveBeenCalledWith(API_CONFIG.PRODUCTS.LIST, {
        searchParams: { page: 1, limit: 10, businessId: 'b1' },
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
