import { BusinessService } from '@/lib/services/business';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';

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
    put: jest.fn(),
  };
  return {
    createAuthenticatedClient: jest.fn(() => mockClient),
    API_CONFIG: jest.requireActual('@/lib/api-config').API_CONFIG,
  };
});

describe('BusinessService', () => {
  let mockClient: ReturnType<typeof createAuthenticatedClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createAuthenticatedClient();
  });

  describe('getMyBusinesses', () => {
    it('should fetch businesses for the current user', async () => {
      const mockResponse = { items: [{ id: 'b1', name: 'Business 1' }] };
      mockClient.get.mockReturnValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await BusinessService.getMyBusinesses();

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.BUSINESS.MY_BUSINESSES
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getBusinessById', () => {
    it('should fetch business details with businessId param', async () => {
      const mockResponse = { id: 'b1', name: 'Business 1' };
      mockClient.get.mockReturnValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await BusinessService.getBusinessById('b1');

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.BUSINESS.GET_BUSINESS,
        {
          searchParams: { businessId: 'b1' },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
