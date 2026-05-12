import { ProductsService } from '@/lib/services/products';
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

describe('ProductsService', () => {
  let mockClient: {
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createAuthenticatedClient() as unknown as {
      get: jest.Mock;
      post: jest.Mock;
      patch: jest.Mock;
      delete: jest.Mock;
    };
  });

  describe('getProducts', () => {
    it('should fetch products with default pagination', async () => {
      const mockResponse = { items: [], total: 0 };
      mockClient.get.mockReturnValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await ProductsService.getProducts();

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.PRODUCTS.LIST,
        expect.objectContaining({
          searchParams: { page: 1, limit: 10 },
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
