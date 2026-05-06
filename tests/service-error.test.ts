import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

describe('handleServiceError', () => {
  it('converts HTTP-like JSON response errors to ApiError', async () => {
    const error = {
      response: {
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          message: 'Access denied',
          type: 'AUTH_FORBIDDEN',
          statusCode: 403,
          email: 'foo@example.com',
        }),
        text: async () => '',
      },
    };

    await expect(handleServiceError(error)).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Access denied',
      type: 'AUTH_FORBIDDEN',
      statusCode: 403,
      email: 'foo@example.com',
    });
  });

  it('converts HTTP-like text response errors to ApiError', async () => {
    const error = {
      response: {
        headers: {
          get: () => 'text/plain',
        },
        json: async () => ({ message: 'unused' }),
        text: async () => 'Something failed',
      },
    };

    await expect(handleServiceError(error)).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Something failed',
    });
  });

  it('rethrows non-http errors unchanged', async () => {
    const originalError = new ApiError('Original');

    await expect(handleServiceError(originalError)).rejects.toBe(originalError);
  });
});
