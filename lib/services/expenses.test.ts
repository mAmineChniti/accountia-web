import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();
const patchMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('@/lib/requests', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/requests')>();
  return {
    ...actual,
    createAuthenticatedClient: () => ({
      get: getMock,
      post: postMock,
      patch: patchMock,
      delete: deleteMock,
    }),
  };
});

import { ExpensesService } from './expenses';

const buildJson = <T = void>(value: T) => ({
  json: () => Promise.resolve(value),
});

describe('ExpensesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExpenses', () => {
    it('forwards businessId / page / limit / status as query params', async () => {
      getMock.mockReturnValue(
        buildJson({ expenses: [], total: 0, page: 1, limit: 10, totalPages: 0 })
      );

      await ExpensesService.getExpenses({
        businessId: 'b1',
        page: 2,
        limit: 25,
        status: 'submitted',
      });

      expect(getMock).toHaveBeenCalledWith(
        'expenses',
        expect.objectContaining({
          searchParams: expect.objectContaining({
            businessId: 'b1',
            page: 2,
            limit: 25,
            status: 'submitted',
          }),
        })
      );
    });

    it('omits status when not provided', async () => {
      getMock.mockReturnValue(
        buildJson({ expenses: [], total: 0, page: 1, limit: 10, totalPages: 0 })
      );

      await ExpensesService.getExpenses({ businessId: 'b1' });
      const params = (
        getMock.mock.calls[0][1] as { searchParams: Record<string, unknown> }
      ).searchParams;
      expect(params).not.toHaveProperty('status');
    });
  });

  describe('createExpense', () => {
    it('POSTs to expenses with the JSON body', async () => {
      postMock.mockReturnValue(buildJson({ id: 'e1' }));
      await ExpensesService.createExpense({
        businessId: 'b1',
        title: 'X',
        amount: 1,
      } as never);
      expect(postMock).toHaveBeenCalledWith(
        'expenses',
        expect.objectContaining({
          json: expect.objectContaining({ title: 'X' }),
        })
      );
    });
  });

  describe('extractReceipt', () => {
    it('builds FormData with the file and businessId', async () => {
      postMock.mockReturnValue(buildJson({ title: 'X' }));
      const file = new File(['hello'], 'r.png', { type: 'image/png' });

      await ExpensesService.extractReceipt(file, 'b1');

      const [endpoint, init] = postMock.mock.calls[0];
      expect(endpoint).toBe('expenses/extract-receipt');
      const body = (init as { body: FormData }).body;
      expect(body).toBeInstanceOf(FormData);
      expect(body.get('businessId')).toBe('b1');
      expect(body.get('file')).toBeInstanceOf(File);
    });
  });

  describe('submitExpense', () => {
    it('PATCHes /expenses/{id}/submit with businessId in query', async () => {
      patchMock.mockReturnValue(buildJson({ id: 'e1', status: 'submitted' }));
      await ExpensesService.submitExpense('e1', 'b1');
      const [endpoint, init] = patchMock.mock.calls[0];
      expect(endpoint).toBe('expenses/e1/submit');
      expect(
        (init as { searchParams: Record<string, string> }).searchParams
      ).toEqual({
        businessId: 'b1',
      });
    });
  });

  describe('deleteExpense', () => {
    it('DELETEs the expense by id with businessId in query', async () => {
      deleteMock.mockReturnValue(buildJson(null));
      await ExpensesService.deleteExpense('e1', 'b1');
      const [endpoint, init] = deleteMock.mock.calls[0];
      expect(endpoint).toBe('expenses/e1');
      expect(
        (init as { searchParams: Record<string, string> }).searchParams
      ).toEqual({
        businessId: 'b1',
      });
    });
  });
});
