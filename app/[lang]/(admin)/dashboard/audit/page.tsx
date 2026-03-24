import { AuditLogsTable } from '@/components/Audit/AuditLogs';

export default function AuditLogsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">System Compliance</h2>
      </div>
      <div className="flex flex-col space-y-4">
        <AuditLogsTable />
      </div>
    </div>
  );
}
