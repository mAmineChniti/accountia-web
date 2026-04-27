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

import { InvoicesService } from './invoices';

const buildJson = <T>(value: T) => ({ json: () => Promise.resolve(value) });

describe('InvoicesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listIssuedInvoices', () => {
    it('defaults to page 1 and limit 10', async () => {
      getMock.mockReturnValue(
        buildJson({ invoices: [], total: 0, page: 1, limit: 10, totalPages: 0 })
      );
      await InvoicesService.listIssuedInvoices();
      const params = (
        getMock.mock.calls[0][1] as { searchParams: Record<string, unknown> }
      ).searchParams;
      expect(params).toMatchObject({ page: 1, limit: 10 });
    });

    it('forwards businessId, status, page and limit when provided', async () => {
      getMock.mockReturnValue(
        buildJson({ invoices: [], total: 0, page: 2, limit: 25, totalPages: 0 })
      );
      await InvoicesService.listIssuedInvoices({
        businessId: 'b1',
        status: 'PAID',
        page: 2,
        limit: 25,
      });
      const params = (
        getMock.mock.calls[0][1] as { searchParams: Record<string, unknown> }
      ).searchParams;
      expect(params).toMatchObject({
        businessId: 'b1',
        status: 'PAID',
        page: 2,
        limit: 25,
      });
    });

    it('hits the LIST_ISSUED endpoint', async () => {
      getMock.mockReturnValue(
        buildJson({ invoices: [], total: 0, page: 1, limit: 10, totalPages: 0 })
      );
      await InvoicesService.listIssuedInvoices();
      expect(getMock.mock.calls[0][0]).toBe('invoices/issued');
    });
  });

  describe('createInvoice', () => {
    it('POSTs to invoices with the JSON body', async () => {
      postMock.mockReturnValue(buildJson({ id: 'i1' }));
      const data = {
        businessId: 'b1',
        items: [{ description: 'X', amount: 1 }],
      };
      await InvoicesService.createInvoice(data as never);
      expect(postMock).toHaveBeenCalledWith(
        'invoices',
        expect.objectContaining({ json: data })
      );
    });
  });

  describe('transitionInvoice', () => {
    it('POSTs the transition with businessId merged into the body', async () => {
      postMock.mockReturnValue(buildJson({ id: 'i1', status: 'ISSUED' }));
      await InvoicesService.transitionInvoice('i1', 'b1', {
        newStatus: 'ISSUED',
      } as never);
      const [endpoint, init] = postMock.mock.calls[0];
      expect(endpoint).toBe('invoices/issued/i1/transition');
      expect((init as { json: Record<string, string> }).json).toEqual({
        newStatus: 'ISSUED',
        businessId: 'b1',
      });
    });

    it('URI-encodes the id segment', async () => {
      postMock.mockReturnValue(buildJson({}));
      await InvoicesService.transitionInvoice('inv 1/with-slash', 'b1', {
        newStatus: 'PAID',
      } as never);
      const [endpoint] = postMock.mock.calls[0];
      expect(endpoint).toBe('invoices/issued/inv%201%2Fwith-slash/transition');
    });
  });

  describe('updateInvoice', () => {
    it('PATCHes the right id with businessId merged in', async () => {
      patchMock.mockReturnValue(buildJson({ id: 'i1' }));
      await InvoicesService.updateInvoice('i1', 'b1', { notes: 'X' } as never);
      const [endpoint, init] = patchMock.mock.calls[0];
      expect(endpoint).toBe('invoices/issued/i1');
      expect((init as { json: Record<string, string> }).json).toEqual({
        notes: 'X',
        businessId: 'b1',
      });
    });
  });
});
