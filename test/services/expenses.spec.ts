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
      EXPENSES: {
        CREATE: 'expenses',
        LIST: 'expenses',
        GET: 'expenses/{id}',
        UPDATE: 'expenses/{id}',
        DELETE: 'expenses/{id}',
      },
    },
  };
});

import { ExpensesService } from '@/lib/services/expenses';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('ExpensesService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('createExpense', () => {
    it('should create an expense', async () => {
      const mockData = { amount: 50, description: 'Lunch' };
      const mockResponse = { id: 'e1', ...mockData };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await ExpensesService.createExpense(mockData as any);

      expect(mockClient.post).toHaveBeenCalledWith(API_CONFIG.EXPENSES.CREATE, {
        json: mockData,
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
