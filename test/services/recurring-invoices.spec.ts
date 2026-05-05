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
      RECURRING_INVOICES: {
        CREATE: 'recurring-invoices',
        LIST: 'recurring-invoices',
      },
    },
  };
});

import { RecurringInvoicesService } from '@/lib/services/recurring-invoices';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('RecurringInvoicesService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('create', () => {
    it('should create a recurring invoice', async () => {
      const mockData = { frequency: 'MONTHLY', amount: 100 };
      const mockResponse = { id: 'ri1', ...mockData };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await RecurringInvoicesService.create(mockData);

      expect(mockClient.post).toHaveBeenCalledWith(
        API_CONFIG.RECURRING_INVOICES.CREATE,
        {
          json: mockData,
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
