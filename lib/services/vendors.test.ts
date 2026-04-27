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

import { VendorsService } from './vendors';

const buildJson = <T = void>(value: T) => ({
  json: () => Promise.resolve(value),
});

describe('VendorsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVendors', () => {
    it('defaults to page 1 / limit 10 when not provided', async () => {
      getMock.mockReturnValue(
        buildJson({ vendors: [], total: 0, page: 1, limit: 10, totalPages: 0 })
      );
      await VendorsService.getVendors({ businessId: 'b1' });
      const params = (
        getMock.mock.calls[0][1] as { searchParams: Record<string, unknown> }
      ).searchParams;
      expect(params).toMatchObject({ businessId: 'b1', page: 1, limit: 10 });
      expect(params).not.toHaveProperty('search');
    });

    it('forwards search when provided', async () => {
      getMock.mockReturnValue(
        buildJson({ vendors: [], total: 0, page: 1, limit: 10, totalPages: 0 })
      );
      await VendorsService.getVendors({ businessId: 'b1', search: 'acme' });
      const params = (
        getMock.mock.calls[0][1] as { searchParams: Record<string, unknown> }
      ).searchParams;
      expect(params.search).toBe('acme');
    });
  });

  describe('createVendor', () => {
    it('POSTs to vendors with the JSON body', async () => {
      postMock.mockReturnValue(buildJson({ id: 'v1' }));
      await VendorsService.createVendor({
        businessId: 'b1',
        name: 'Acme',
      });
      expect(postMock).toHaveBeenCalledWith(
        'vendors',
        expect.objectContaining({
          json: expect.objectContaining({ name: 'Acme' }),
        })
      );
    });
  });

  describe('updateVendor', () => {
    it('PATCHes the right id', async () => {
      patchMock.mockReturnValue(buildJson({ id: 'v1' }));
      await VendorsService.updateVendor('v1', { name: 'New' });
      expect(patchMock).toHaveBeenCalledWith(
        'vendors/v1',
        expect.objectContaining({ json: { name: 'New' } })
      );
    });
  });

  describe('deleteVendor', () => {
    it('DELETEs by id with businessId in query', async () => {
      deleteMock.mockReturnValue(buildJson(null));
      await VendorsService.deleteVendor('v1', 'b1');
      expect(deleteMock).toHaveBeenCalledWith('vendors/v1', {
        searchParams: { businessId: 'b1' },
      });
    });
  });
});
