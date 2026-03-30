'use client';

import { useState, useEffect } from 'react';
import { Plus, Repeat, Play, Pause, Trash2, MoreVertical, Download } from 'lucide-react';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import CreateRecurringInvoiceModal from './CreateRecurringInvoiceModal';
import { BusinessService } from '@/lib/requests';

export default function RecurringInvoicesContent({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeCount: 0, pausedCount: 0, estimatedMrr: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSchedules = async () => {
    try {
      const [schedulesData, statsData] = await Promise.all([
        BusinessService.getRecurringInvoices(),
        BusinessService.getRecurringInvoiceStats(),
      ]);
      setSchedules(schedulesData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to fetch recurring invoices:', error);
      toast.error(error.message || 'Failed to load recurring invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    status: 'active' | 'paused' | 'cancelled'
  ) => {
    try {
      await BusinessService.updateRecurringInvoiceStatus(id, status);
      toast.success(`Schedule was ${status}`);
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule forever?'))
      return;
    try {
      await BusinessService.deleteRecurringInvoice(id);
      toast.success('Schedule deleted successfully');
      fetchSchedules();
    } catch {
      toast.error('Failed to delete schedule');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await BusinessService.downloadRecurringInvoice(id);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `recurring-invoice-${id.slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Invoices</h1>
          <p className="text-muted-foreground mt-1">Automate invoice generation on a schedule.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Recurring Invoice
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card flex flex-col gap-1 p-6 rounded-xl border shadow-sm bg-card">
          <div className="text-muted-foreground text-sm font-medium">Estimated MRR</div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(stats.estimatedMrr)}</div>
        </div>
        <div className="glass-card flex flex-col gap-1 p-6 rounded-xl border shadow-sm bg-card">
          <div className="text-muted-foreground text-sm font-medium">Active Schedules</div>
          <div className="text-2xl font-bold">{stats.activeCount}</div>
        </div>
        <div className="glass-card flex flex-col gap-1 p-6 rounded-xl border shadow-sm bg-card">
          <div className="text-muted-foreground text-sm font-medium">Paused Schedules</div>
          <div className="text-2xl font-bold">{stats.pausedCount}</div>
        </div>
      </div>

      {/* List */}
      <div className="glass-card rounded-xl border shadow-sm bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">Client</th>
                <th className="p-4 font-medium text-muted-foreground">Amount</th>
                <th className="p-4 font-medium text-muted-foreground">Frequency</th>
                <th className="p-4 font-medium text-muted-foreground">Next Run Date</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground animate-pulse">Loading schedules...</td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Repeat className="mx-auto h-8 w-8 opacity-20 mb-2" />
                    No recurring invoices found. Create one to get started.
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{schedule.clientName}</td>
                    <td className="p-4 font-bold">{formatCurrency(schedule.totalAmount)}</td>
                    <td className="p-4 capitalize">{schedule.frequency}</td>
                    <td className="p-4">{new Date(schedule.nextRunDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${schedule.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                        ${schedule.status === 'paused' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                        ${schedule.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                      `}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {schedule.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(schedule._id, 'paused')}>
                              <Pause className="mr-2 h-4 w-4" /> Pause
                            </DropdownMenuItem>
                          ) : schedule.status === 'paused' ? (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(schedule._id, 'active')}>
                              <Play className="mr-2 h-4 w-4" /> Resume
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            handleDownload(schedule._id);
                          }}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(schedule._id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateRecurringInvoiceModal
        lang={lang}
        dictionary={dictionary}
        open={isModalOpen}
        setOpen={setIsModalOpen}
        onSuccess={fetchSchedules}
      />
    </div>
  );
}
