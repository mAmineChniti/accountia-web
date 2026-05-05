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
      REPORTS: {
        VAT: 'reports/vat',
      },
    },
  };
});

import { ReportsService } from '@/lib/services/reports';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('ReportsService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('getVatReport', () => {
    it('should fetch VAT report', async () => {
      const mockParams = { businessId: 'b1', period: 'monthly' as const };
      const mockResponse = { totalVat: 100 };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await ReportsService.getVatReport(mockParams);

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.REPORTS.VAT,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
