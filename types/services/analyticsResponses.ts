import { type BaseResponse } from './sharedTypes';

export interface FinancialSummary {
  totalRevenue: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalPaid: number;
  averageInvoiceValue: number;
  collectionRate: number;
  averageDaysToPay: number;
  currency: string;
}

export interface RevenueDataPoint {
  period: string;
  revenue: number;
  invoiceCount: number;
  paid: number;
  unpaid: number;
}

export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
  daysRange: string;
}

export interface TopClient {
  clientName: string;
  totalRevenue: number;
  invoiceCount: number;
  avgDaysToPay: number;
  lastInvoiceDate: string;
}

export interface CashFlowForecast {
  date: string;
  expectedInflow: number;
  invoiceNumber: string;
  recipientName: string;
  status: string;
}

export interface AnalyticsDashboardResponse extends BaseResponse {
  summary: FinancialSummary;
  revenueTimeline: RevenueDataPoint[];
  arAging: AgingBucket[];
  topClients: TopClient[];
  cashFlowForecast: CashFlowForecast[];
  expenseSummary?: {
    total: number;
    byCategory: Array<{ category: string; total: number }>;
  };
}
