import { AuthService } from '@/lib/services/auth';
import { API_CONFIG } from '@/lib/api-config';
import { publicClient, createAuthenticatedClient } from '@/lib/requests';

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_BACKEND: 'http://localhost:4789/api',
  },
}));

// Mock requests without requireActual to avoid circular dependency
jest.mock('@/lib/requests', () => {
  const mockAuthenticatedClient = {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return {
    publicClient: {
      post: jest.fn(),
      get: jest.fn(),
    },
    createAuthenticatedClient: jest.fn(() => mockAuthenticatedClient),
    API_CONFIG: jest.requireActual('@/lib/api-config').API_CONFIG,
    ApiError: class ApiError extends Error {
      static fromResponse(res: { message?: string }) {
        return new ApiError(res.message);
      }
    },
    safeParseJson: jest.fn(),
  };
});

jest.mock('@/actions/cookies', () => ({
  getToken: jest.fn(),
  getTokenAllowExpired: jest.fn(),
  setTokens: jest.fn(),
  setUser: jest.fn(),
  getUser: jest.fn(),
}));

describe('AuthService', () => {
  const mockAuthClient = createAuthenticatedClient() as unknown as {
    post: jest.Mock;
    get: jest.Mock;
    patch: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call publicClient.post and return result', async () => {
      const mockData = { email: 'test@test.com', password: 'password' };
      const mockRes = { accessToken: 'abc' };
      (publicClient.post as jest.Mock).mockReturnValue({
        json: jest.fn().mockResolvedValue(mockRes),
      });

      const res = await AuthService.login(mockData);
      expect(publicClient.post).toHaveBeenCalledWith(
        API_CONFIG.AUTH.LOGIN,
        expect.objectContaining({ json: mockData })
      );
      expect(res).toEqual(mockRes);
    });
  });

  describe('register', () => {
    it('should call publicClient.post for registration', async () => {
      const mockData = {
        email: 'test@test.com',
        password: 'password',
        username: 'test',
      };
      (publicClient.post as jest.Mock).mockReturnValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      await AuthService.register(
        mockData as Parameters<typeof AuthService.register>[0]
      );
      expect(publicClient.post).toHaveBeenCalledWith(
        API_CONFIG.AUTH.REGISTER,
        expect.objectContaining({ json: mockData })
      );
    });
  });

  describe('logout', () => {
    it('should call authenticated client post for logout', async () => {
      mockAuthClient.post.mockReturnValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      await AuthService.logout('refresh-token');
      expect(mockAuthClient.post).toHaveBeenCalledWith(
        API_CONFIG.AUTH.LOGOUT,
        expect.objectContaining({
          json: { refreshToken: 'refresh-token' },
        })
      );
    });
  });

  describe('fetchUser', () => {
    it('should fetch current user profile', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      mockAuthClient.get.mockReturnValue({
        json: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await AuthService.fetchUser();
      expect(mockAuthClient.get).toHaveBeenCalledWith(
        API_CONFIG.AUTH.FETCH_USER
      );
      expect(res).toEqual(mockUser);
    });
  });
});
