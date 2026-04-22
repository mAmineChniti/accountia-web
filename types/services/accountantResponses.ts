import type { ApiResponse } from './sharedTypes';

// Accounting Job Status Types (API uses lowercase, includes cancelled)
export type AccountingJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Tax Calculation (matches API docs)
export interface TaxCalculation {
  tax_type: string;
  jurisdiction: string;
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;
}

// Anomaly Detected (matches API docs)
export interface AnomalyDetected {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_transactions?: string[];
}

// Report from results
export interface JobReport {
  report_type: string;
  generated_at?: string;
  download_url?: string;
  data?: Record<string, unknown>;
}

// Journal Entry Preview
export interface JournalEntryPreview {
  date: string;
  account: string;
  debit: number;
  credit: number;
  description?: string;
}

// Journal Entry (results)
export interface JournalEntry {
  date: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  description?: string;
  reference?: string;
}

// Transaction from results
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  account?: string;
  currency?: string;
}

// Accounting Job Details (GET /jobs/{taskId}) - unwrapped
export interface AccountingJobDetails {
  task_id: string;
  business_id: string;
  period_start: string;
  period_end: string;
  status: AccountingJobStatus;
  progress_percent: number;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  journal_entries_count?: number;
  reports_generated?: number;
}

// Create Accounting Job Response (POST /jobs) - unwrapped
export interface CreateAccountingJobResponse {
  task_id: string;
  status: AccountingJobStatus;
  message: string;
  estimated_completion?: string;
  business_id?: string;
  period_start?: string;
  period_end?: string;
  created_at?: string;
}

// Wrapped response aliases using generic ApiResponse<T>
export type CreateAccountingJobWrapper =
  ApiResponse<CreateAccountingJobResponse>;
export type AccountingJobDetailsWrapper = ApiResponse<AccountingJobDetails>;
export type GetAccountingJobResultsWrapper =
  ApiResponse<GetAccountingJobResultsResponse>;
export type CancelJobWrapper = ApiResponse<CancelJobResponse>;
export type AccountingHistoryWrapper = ApiResponse<AccountingHistoryResponse>;
export type AccountingWorkLogWrapper = ApiResponse<AccountingWorkLogResponse>;
export type TaxSummaryWrapper = ApiResponse<TaxSummaryResponse>;

// Job list item with period info (used in list response)
export interface AccountingJobListItemWithPeriod {
  task_id: string;
  period_start: string;
  period_end: string;
  status: AccountingJobStatus;
  progress_percent?: number;
  started_at?: string | null;
  completed_at?: string | null;
  business_id?: string;
  error_message?: string | null;
  journal_entries_count?: number;
  reports_generated?: number;
}

// List Accounting Jobs Response (GET /jobs) — wrapped with success + meta
export interface ListAccountingJobsResponse extends ApiResponse<
  AccountingJobListItemWithPeriod[]
> {
  meta: { total: number };
}

// Get Accounting Job Results Response (GET /jobs/{taskId}/results) - unwrapped
export interface GetAccountingJobResultsResponse {
  task_id: string;
  business_id: string;
  period_start: string;
  period_end: string;
  status: AccountingJobStatus;
  total_revenue?: number;
  total_expenses?: number;
  gross_profit?: number;
  net_profit?: number;
  tax_calculations?: TaxCalculation[];
  ai_insights?: string;
  recommendations?: string[];
  anomalies_detected?: AnomalyDetected[];
  reports?: JobReport[];
  journal_entries_preview?: JournalEntryPreview[];
  journal_entries?: JournalEntry[];
  total_journal_entries?: number;
  completed_at?: string | null;
}

// Cancel Job Response (DELETE /jobs/{taskId}) - unwrapped
export interface CancelJobResponse {
  task_id: string;
  status: 'cancelled';
  message: string;
  previous_status?: string;
}

// Accounting History Task
export interface AccountingHistoryTask {
  task_id: string;
  status: AccountingJobStatus;
  period_start: string;
  period_end: string;
  completed_at?: string | null;
}

// Accounting History Response (GET /business/{businessId}/history) - unwrapped
export interface AccountingHistoryResponse {
  business_id: string;
  tasks: AccountingHistoryTask[];
}

// Work Log Entry
export interface WorkLogEntry {
  date: string;
  type: string;
  description: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

// Work Log Summary
export interface WorkLogSummary {
  total_accounting_periods: number;
  completed: number;
  pending: number;
  processing: number;
  failed: number;
  total_journal_entries_generated?: number;
  total_revenue_processed?: number;
}

// Accounting Period Detail
export interface AccountingPeriodDetail {
  task_id: string;
  period_start: string;
  period_end: string;
  status: AccountingJobStatus;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  journal_entries_count?: number;
  tax_calculations_count?: number;
  reports_count?: number;
  has_ai_insights?: boolean;
  recommendations_count?: number;
  financial_summary?: {
    total_revenue?: number;
    total_expenses?: number;
    gross_profit?: number;
    net_profit?: number;
    accounts_receivable?: number;
    accounts_payable?: number;
    cash_position?: number;
  };
}

// Accounting Work Log Response (GET /business/{businessId}/work) - unwrapped
export interface AccountingWorkLogResponse {
  business_id: string;
  database_name?: string;
  summary: WorkLogSummary;
  accounting_periods: AccountingPeriodDetail[];
}

// VAT Breakdown
export interface VatBreakdown {
  standard_rate_19_percent?: number;
  reduced_rate_13_percent?: number;
  reduced_rate_7_percent?: number;
}

// Monthly Tax Detail
export interface MonthlyTaxDetail {
  month: number;
  period?: string;
  vat_standard_19?: number;
  vat_reduced_13?: number;
  vat_reduced_7?: number;
  vat_total?: number;
  taxable_income?: number;
  corporate_tax_due?: number;
  withholding_tax?: number;
  total_tax_liability?: number;
  due_date?: string;
}

// Tax Calendar Item
export interface TaxCalendarItem {
  period: string;
  due_date: string;
  description?: string;
}

// Tax Summary Data
export interface TaxSummaryData {
  annual_vat_total?: number;
  annual_corporate_tax?: number;
  annual_withholding_tax?: number;
  total_tax_liability?: number;
}

// Tax Summary Response (GET /business/{businessId}/taxes) - unwrapped
export interface TaxSummaryResponse {
  business_id: string;
  business_name?: string;
  year?: number;
  currency?: string;
  summary: TaxSummaryData;
  vat_breakdown?: VatBreakdown;
  monthly_details?: MonthlyTaxDetail[];
  tax_calendar?: TaxCalendarItem[];
  notes?: string[];
}

// Health Check Response (kept wrapped)
export interface AccountantHealthResponse {
  success: boolean;
  service: string;
  status: 'available' | 'unavailable';
}
