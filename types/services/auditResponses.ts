export enum AuditAction {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  LOGOUT = 'LOGOUT',
  EMAIL_CONFIRMED = 'EMAIL_CONFIRMED',
  FAILED_LOGIN = 'FAILED_LOGIN',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ROLE_CHANGE = 'ROLE_CHANGE',
  USER_DELETED = 'USER_DELETED',
  UNBAN_USER = 'UNBAN_USER',
  INVITE_SENT = 'INVITE_SENT',
  INVITE_ACCEPTED = 'INVITE_ACCEPTED',
  APPROVE_BUSINESS = 'APPROVE_BUSINESS',
  REJECT_BUSINESS = 'REJECT_BUSINESS',
  BAN_USER = 'BAN_USER',
  DELETE_BUSINESS = 'DELETE_BUSINESS',
  CREATE_BUSINESS = 'CREATE_BUSINESS',
  OTHER = 'OTHER',
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  userRole: string;
  target?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  updatedAt?: string;
  // Backward compatibility for legacy consumers that used `timestamp`.
  timestamp?: string;
}

export interface AuditLogListResponse {
  message?: string;
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PaginatedAuditLogsDto = AuditLogListResponse;
