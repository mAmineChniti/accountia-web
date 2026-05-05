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
      CHAT: {
        SEND_MESSAGE: 'chat/message',
        GET_HISTORY: 'chat/history',
      },
    },
  };
});

import { ChatService } from '@/lib/services/chat';
import { setupServiceMocks } from '../mocks/service-mock-utils';

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupServiceMocks();
  });

  describe('createClient', () => {
    it('should create a ChatSocketClient instance', () => {
      const client = ChatService.createClient();
      expect(client).toBeDefined();
      expect(typeof client.connect).toBe('function');
    });
  });
});
