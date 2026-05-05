/* eslint-disable */
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
      AUTH: {
        LOGIN: 'auth/login',
      },
    },
  };
});

import { AuthService } from '@/lib/services/auth';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('AuthService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('login', () => {
    it('should call the login endpoint', async () => {
      const mockData = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { user: { id: '1' }, token: 'token' };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await AuthService.login(mockData);

      expect(mockClient.post).toHaveBeenCalledWith(API_CONFIG.AUTH.LOGIN, {
        json: mockData,
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
