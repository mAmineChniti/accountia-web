import { ExpensesService } from '@/lib/services/expenses';
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

describe('ExpensesService', () => {
  const mockClient = createAuthenticatedClient() as unknown as {
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getExpenses', () => {
    it('should fetch expenses with businessId', async () => {
      mockClient.get.mockReturnValue({
        json: jest.fn().mockResolvedValue({ items: [] }),
      });

      await ExpensesService.getExpenses({ businessId: 'b1' });
      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.EXPENSES.LIST,
        expect.objectContaining({
          searchParams: { businessId: 'b1', page: 1, limit: 10 },
        })
      );
    });
  });

  describe('createExpense', () => {
    it('should post expense data', async () => {
      const mockData = { amount: 50, category: 'Food', businessId: 'b1' };
      mockClient.post.mockReturnValue({
        json: jest.fn().mockResolvedValue({ id: 'e1' }),
      });

      await ExpensesService.createExpense(
        mockData as unknown as Parameters<
          typeof ExpensesService.createExpense
        >[0]
      );
      expect(mockClient.post).toHaveBeenCalledWith(
        API_CONFIG.EXPENSES.CREATE,
        expect.objectContaining({
          json: mockData,
        })
      );
    });
  });
});
