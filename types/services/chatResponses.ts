import { type BaseResponse } from './sharedTypes';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessageResponse extends BaseResponse {
  response: string;
}

export interface ChatMessageStartEvent {
  messageId: string;
  timestamp: string;
}

export interface ChatMessageChunkEvent {
  messageId: string;
  chunk: string;
}

export interface ChatMessageCompleteEvent {
  messageId: string;
  response: string;
  duration: number;
  timestamp: string;
}

export interface ChatMessageErrorEvent {
  messageId: string;
  message: string;
}

export interface ChatConnectedEvent {
  status: 'connected';
  userId: string;
}

export interface ChatConnectErrorEvent {
  message: string;
}

export interface ChatPongEvent {
  timestamp: string;
}

export type ChatEventCallback<T> = (data: T) => void;
