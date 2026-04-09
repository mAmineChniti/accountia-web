import type { ChatMessageInput, ChatMessageResponse } from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const ChatService = {
  async sendMessage(data: ChatMessageInput): Promise<ChatMessageResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.CHAT.SEND_MESSAGE, { json: data })
        .json<ChatMessageResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
