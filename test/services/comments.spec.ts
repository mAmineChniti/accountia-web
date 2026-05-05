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
      COMMENTS: {
        CREATE: 'comments',
        LIST: 'comments',
      },
    },
  };
});

import { CommentsService } from '@/lib/services/comments';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('CommentsService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('createComment', () => {
    it('should add a comment', async () => {
      const mockData = {
        businessId: 'b1',
        entityType: 'invoice',
        entityId: 'i1',
        body: 'Nice!',
      };
      const mockResponse = { id: 'c1', ...mockData };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await CommentsService.createComment(mockData);

      expect(mockClient.post).toHaveBeenCalledWith(API_CONFIG.COMMENTS.CREATE, {
        json: mockData,
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
