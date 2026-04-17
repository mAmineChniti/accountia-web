import { io, type Socket } from 'socket.io-client';
import { env } from '@/env';
import { getToken } from '@/actions/cookies';
import type {
  ChatMessageInput,
  ChatMessageStartEvent,
  ChatMessageChunkEvent,
  ChatMessageCompleteEvent,
  ChatMessageErrorEvent,
  ChatConnectedEvent,
  ChatConnectErrorEvent,
  ChatPongEvent,
  ChatEventCallback,
} from '@/types/services';

export interface ChatCallbacks {
  onStart?: ChatEventCallback<ChatMessageStartEvent>;
  onChunk?: ChatEventCallback<ChatMessageChunkEvent>;
  onComplete?: ChatEventCallback<ChatMessageCompleteEvent>;
  onError?: ChatEventCallback<ChatMessageErrorEvent>;
  onConnected?: ChatEventCallback<ChatConnectedEvent>;
  onConnectError?: ChatEventCallback<ChatConnectErrorEvent>;
  onPong?: ChatEventCallback<ChatPongEvent>;
  onDisconnect?: (reason: string) => void;
}

export class ChatSocketClient {
  private socket: Socket | undefined = undefined;
  private callbacks: ChatCallbacks = {};
  private pendingMessages: Map<
    string,
    {
      resolve: (value: string) => void;
      reject: (reason: string) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  > = new Map();

  async connect(callbacks: ChatCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;

    // Clean up existing socket before creating new one
    if (this.socket) {
      this.disconnect();
    }

    const tokenData = await getToken();
    const token = tokenData?.token;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const baseUrl = env.NEXT_PUBLIC_BACKEND ?? 'http://127.0.0.1:4789/api';
    const wsUrl = baseUrl.replace(/^http/, 'ws').replace(/\/api$/, '');

    this.socket = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket initialization failed'));
        return;
      }

      const timeoutId = setTimeout(() => {
        this.socket?.off('connected', onConnected);
        this.socket?.off('connect_error', onConnectError);
        reject(new Error('Connection timeout'));
      }, 10_000);

      const onConnected = () => {
        clearTimeout(timeoutId);
        this.socket?.off('connect_error', onConnectError);
        resolve();
      };

      // Intentionally typed as ChatConnectErrorEvent for simplicity;
      // socket.io-client Error has more fields (description, context, type)
      // but message is sufficient for user-facing error display
      const onConnectError = (error: ChatConnectErrorEvent) => {
        clearTimeout(timeoutId);
        this.socket?.off('connected', onConnected);
        reject(new Error(error.message || 'Connection failed'));
      };

      this.socket.once('connected', onConnected);
      this.socket.once('connect_error', onConnectError);
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connected', (data: ChatConnectedEvent) => {
      this.callbacks.onConnected?.(data);
    });

    this.socket.on('connect_error', (data: ChatConnectErrorEvent) => {
      this.callbacks.onConnectError?.(data);
    });

    this.socket.on('message_start', (data: ChatMessageStartEvent) => {
      this.callbacks.onStart?.(data);
    });

    this.socket.on('message_chunk', (data: ChatMessageChunkEvent) => {
      this.callbacks.onChunk?.(data);
    });

    this.socket.on('message_complete', (data: ChatMessageCompleteEvent) => {
      const pending = this.pendingMessages.get(data.messageId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pending.resolve(data.response);
        this.pendingMessages.delete(data.messageId);
      }
      this.callbacks.onComplete?.(data);
    });

    this.socket.on('message_error', (data: ChatMessageErrorEvent) => {
      const pending = this.pendingMessages.get(data.messageId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pending.reject(data.message);
        this.pendingMessages.delete(data.messageId);
      }
      this.callbacks.onError?.(data);
    });

    this.socket.on('pong', (data: ChatPongEvent) => {
      this.callbacks.onPong?.(data);
    });

    this.socket.on('disconnect', (reason: string) => {
      // Reject all pending messages due to socket disconnect
      for (const [, pending] of this.pendingMessages) {
        clearTimeout(pending.timeoutId);
        pending.reject(`Socket disconnected: ${reason}`);
      }
      this.pendingMessages.clear();
      this.callbacks.onDisconnect?.(reason);
    });
  }

  sendMessage(data: ChatMessageInput): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Reject any existing pending message with the same ID
      const existing = this.pendingMessages.get(data.messageId);
      if (existing) {
        clearTimeout(existing.timeoutId);
        existing.reject('Message replaced by new request');
        this.pendingMessages.delete(data.messageId);
      }

      const timeoutId = setTimeout(() => {
        if (this.pendingMessages.has(data.messageId)) {
          this.pendingMessages.delete(data.messageId);
          reject(new Error('Message timeout'));
        }
      }, 60_000);

      this.pendingMessages.set(data.messageId, { resolve, reject, timeoutId });
      this.socket.emit('chat_message', data);
    });
  }

  ping(): void {
    this.socket?.emit('ping');
  }

  disconnect(): void {
    for (const [, pending] of this.pendingMessages) {
      clearTimeout(pending.timeoutId);
      pending.reject('Connection closed');
    }
    this.pendingMessages.clear();
    this.socket?.disconnect();
    this.socket = undefined;
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

let globalClient: ChatSocketClient | undefined;

export const ChatService = {
  createClient(): ChatSocketClient {
    return new ChatSocketClient();
  },

  getGlobalClient(): ChatSocketClient | undefined {
    return globalClient;
  },

  setGlobalClient(client: ChatSocketClient | undefined): void {
    globalClient = client;
  },
};
