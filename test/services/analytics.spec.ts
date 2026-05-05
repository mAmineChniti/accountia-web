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
      ANALYTICS: {
        DASHBOARD: 'analytics/dashboard',
      },
    },
  };
});

import { AnalyticsService } from '@/lib/services/analytics';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('AnalyticsService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('getDashboard', () => {
    it('should fetch dashboard stats', async () => {
      const mockResponse = { totalRevenue: 1000 };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await AnalyticsService.getDashboard({ businessId: 'b1' });

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.ANALYTICS.DASHBOARD,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
