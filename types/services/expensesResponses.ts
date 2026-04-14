import { type BaseResponse } from './sharedTypes';

export interface Expense {
  id: string;
  businessId: string;
  submittedBy: string;
  submittedByName: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  expenseDate: string;
  description?: string;
  vendor?: string;
  receiptBase64?: string;
  receiptMimeType?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  reimbursedAt?: string;
  isBillable: boolean;
  linkedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseResponse = BaseResponse & Expense;

export interface ExpenseListResponse extends BaseResponse {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpenseSummaryResponse extends BaseResponse {
  totalAmount: number;
  byCategory: Array<{ category: string; total: number; count: number }>;
  byStatus: Array<{ status: string; total: number; count: number }>;
  pendingReview: number;
  currency: string;
}
