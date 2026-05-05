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
      BUSINESS: {
        APPLY: 'business/apply',
        GET_BUSINESS: 'business/details',
      },
    },
  };
});

import { BusinessService } from '@/lib/services/business';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('BusinessService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('applyForBusiness', () => {
    it('should apply for a business', async () => {
      const mockData = { name: 'Test Biz' };
      const mockResponse = { id: 'b1', ...mockData };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await BusinessService.applyForBusiness(mockData as any);

      expect(mockClient.post).toHaveBeenCalledWith(API_CONFIG.BUSINESS.APPLY, {
        json: mockData,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getBusinessById', () => {
    it('should fetch a business by id', async () => {
      const mockResponse = { id: 'b1', name: 'Test Biz' };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await BusinessService.getBusinessById('b1');

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.BUSINESS.GET_BUSINESS,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
