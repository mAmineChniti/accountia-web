'use client';

import { useState, useEffect } from 'react';
import { fetchAuditLogs } from '@/actions/audit';
import type { AuditLog, PaginatedAuditLogs } from '@/types/audit';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ACTION_COLORS: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
  LOGIN: 'default',
  REGISTER: 'default',
  APPROVE_BUSINESS: 'default', 
  REJECT_BUSINESS: 'destructive',
  BAN_USER: 'destructive',
  DELETE_BUSINESS: 'destructive',
  OTHER: 'secondary',
};

export function AuditLogsTable() {
  const [logsData, setLogsData] = useState<PaginatedAuditLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const loadLogs = async (currentPage: number, filter: string) => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs(
        currentPage,
        20,
        filter === 'ALL' ? undefined : filter
      );
      setLogsData(data);
    } catch (error) {
        console.error("Failed to load audit logs", error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(page, actionFilter);
  }, [page, actionFilter]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Filter by Action:</span>
          <Select
            value={actionFilter}
            onValueChange={(val: string) => {
              setActionFilter(val);
              setPage(1); // Reset to page 1 on filter change
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="REGISTER">Register</SelectItem>
              <SelectItem value="APPROVE_BUSINESS">Approve Business</SelectItem>
              <SelectItem value="REJECT_BUSINESS">Reject Business</SelectItem>
              <SelectItem value="BAN_USER">Ban User</SelectItem>
              <SelectItem value="DELETE_BUSINESS">Delete Business</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Performed by</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                </TableRow>
              ))
            ) : logsData?.logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              logsData?.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_COLORS[log.action] || 'secondary'}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     {log.userEmail || 'System/Guest'}
                  </TableCell>
                  <TableCell>
                    {log.userRole || 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.target || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {logsData && logsData.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {logsData.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(logsData.totalPages, p + 1))}
            disabled={page === logsData.totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
