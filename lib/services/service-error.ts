import { ApiError, safeParseJson, type HTTPErrorLike } from '@/lib/requests';

export const handleServiceError = async (error: unknown): Promise<never> => {
  if (error && typeof error === 'object' && 'response' in error) {
    const errorData = await safeParseJson((error as HTTPErrorLike).response);
    throw ApiError.fromResponse(errorData);
  }

  throw error;
};
