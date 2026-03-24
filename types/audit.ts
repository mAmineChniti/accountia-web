export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  userRole: string;
  details: Record<string, any>;
  target?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
