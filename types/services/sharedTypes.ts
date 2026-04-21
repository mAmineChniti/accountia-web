export interface BaseResponse {
  message: string;
  timestamp?: string;
}

// Generic API wrapper for endpoints that return `{ success, data, message? }`.
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}
