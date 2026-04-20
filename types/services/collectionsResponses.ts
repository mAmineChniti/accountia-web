export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InvoiceRiskScore {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  outstandingAmount: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  status: string;
  recipientLabel: string;
  riskScore: number;
  riskLevel: RiskLevel;
  historyCount: number;
  avgHistoricalDelayDays?: number;
  clientLatePaymentRate?: number;
}

export interface CollectionsDashboard {
  totalOpenInvoices: number;
  totalOutstandingAmount: number;
  currency: string;
  riskBreakdown: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  amountByRisk: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  scores: InvoiceRiskScore[];
}

export interface GenerateReminderResponse {
  invoiceId: string;
  riskLevel: RiskLevel;
  reminderMessage: string;
  subject: string;
  recommendedAction?: string;
}
