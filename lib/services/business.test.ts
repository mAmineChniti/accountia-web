import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the kyClient factory so no real network call is attempted.
const getMock = vi.fn();
const postMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('@/lib/requests', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/requests')>();
  return {
    ...actual,
    createAuthenticatedClient: () => ({
      get: getMock,
      post: postMock,
      delete: deleteMock,
    }),
  };
});

import { BusinessService } from './business';

const buildJson = <T>(value: T) => ({ json: () => Promise.resolve(value) });

describe('BusinessService.getTeamMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an empty businessId', async () => {
    await expect(BusinessService.getTeamMembers('')).rejects.toThrow(
      /Invalid businessId/
    );
    await expect(BusinessService.getTeamMembers('   ')).rejects.toThrow(
      /Invalid businessId/
    );
  });

  it('GETs business/team with the businessId in the query string', async () => {
    getMock.mockReturnValue(
      buildJson({ message: 'ok', members: [{ id: '1', role: 'OWNER' }] })
    );

    const res = await BusinessService.getTeamMembers('b1');
    expect(getMock).toHaveBeenCalledWith('business/team', {
      searchParams: { businessId: 'b1' },
    });
    expect(res.members).toHaveLength(1);
  });

  it('wraps errors with response data into ApiError', async () => {
    const httpError = {
      response: { json: () => Promise.resolve({ message: 'nope' }) },
    };
    getMock.mockReturnValue({
      json: () => Promise.reject(httpError),
    });

    await expect(BusinessService.getTeamMembers('b1')).rejects.toThrow();
  });
});
