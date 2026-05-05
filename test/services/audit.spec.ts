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
      AUDIT: {
        GET_LOGS: 'audit/logs',
      },
    },
  };
});

import { AuditService } from '@/lib/services/audit';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('AuditService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('getAuditLogs', () => {
    it('should fetch audit logs', async () => {
      const mockResponse = { logs: [], total: 0 };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await AuditService.getAuditLogs();

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.AUDIT.GET_LOGS,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
