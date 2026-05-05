import { type BaseResponse } from './sharedTypes';

export interface RecurringLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  description?: string;
}

export interface RecurringInvoice {
  id: string;
  businessId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  startDate: string;
  endCondition: 'never' | 'after_occurrences' | 'by_date';
  maxOccurrences?: number;
  occurrenceCount: number;
  endDate?: string;
  nextRunAt: string;
  lastRunAt?: string;
  lineItems: RecurringLineItem[];
  totalAmount: number;
  currency: string;
  dueDaysFromIssue: number;
  recipient: Record<string, unknown>;
  description?: string;
  paymentTerms?: string;
  autoIssue: boolean;
  generatedInvoiceIds: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecurringInvoiceResponse = BaseResponse & RecurringInvoice;

export interface RecurringInvoiceListResponse extends BaseResponse {
  schedules: RecurringInvoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
