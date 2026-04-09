import { type BaseResponse } from './sharedTypes';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessageResponse extends BaseResponse {
  response: string;
}
