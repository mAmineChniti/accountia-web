import type { InvoiceStatus } from '@/types/services';
import type { Dictionary } from '@/get-dictionary';

/**
 * Get localized status label for an invoice status
 */
export function getStatusLabel(
  status: InvoiceStatus,
  dictionary: Dictionary
): string {
  const d = dictionary.pages.invoices;
  const statusMap: Record<InvoiceStatus, string> = {
    DRAFT: d.statusDraft,
    ISSUED: d.statusIssued,
    VIEWED: d.statusViewed,
    PAID: d.statusPaid,
    PARTIAL: d.statusPartial,
    OVERDUE: d.statusOverdue,
    DISPUTED: d.statusDisputed,
    VOIDED: d.statusVoided,
    ARCHIVED: d.statusArchived,
  };
  return statusMap[status] || status;
}
