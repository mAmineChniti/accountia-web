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
      ACCOUNTANT: {
        CREATE_JOB: 'accountant/jobs',
        LIST_JOBS: 'accountant/jobs',
        GET_JOB_RESULTS: 'accountant/jobs/{taskId}',
        GET_TAXES: 'accountant/taxes/{year}',
        CALCULATE_TAXES: 'accountant/taxes/{year}/calculate',
        HEALTH: 'accountant/health',
      },
    },
  };
});

import { AccountantService } from '@/lib/services/accountant';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('AccountantService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('listJobs', () => {
    it('should fetch accountant jobs', async () => {
      const mockResponse = { data: [], total: 0 };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await AccountantService.listJobs({ businessId: 'b1' });

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.ACCOUNTANT.LIST_JOBS,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
