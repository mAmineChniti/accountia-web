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
      NOTIFICATIONS: {
        GET_NOTIFICATIONS: 'notifications',
        MARK_AS_READ: 'notifications/{id}/read',
        MARK_ALL_AS_READ: 'notifications/read-all',
      },
    },
  };
});

import { NotificationsService } from '@/lib/services/notifications';
import { API_CONFIG } from '@/lib/requests';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('NotificationsService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = setupServiceMocks();
  });

  describe('getNotifications', () => {
    it('should fetch notifications', async () => {
      const mockResponse = { notifications: [], unreadCount: 0 };
      mockClient.json.mockResolvedValue(mockResponse);

      const result = await NotificationsService.getNotifications();

      expect(mockClient.get).toHaveBeenCalledWith(
        API_CONFIG.NOTIFICATIONS.GET_NOTIFICATIONS,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
