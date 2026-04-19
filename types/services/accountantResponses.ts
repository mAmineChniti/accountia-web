// Accounting Job Status Types
export type AccountingJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

// Tax Calculation
export interface TaxCalculation {
  tax_type: string;
  jurisdiction: string;
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;
}

// Anomaly Detected
export interface AnomalyDetected {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

// Report Data
export interface ReportData {
  revenue: number;
  cogs: number;
  gross_profit: number;
  operating_expenses: number;
  net_profit: number;
}

// Report
export interface AccountingReport {
  report_type: string;
  period_start: string;
  period_end: string;
  data: ReportData;
}

// Journal Entry Preview
export interface JournalEntryPreview {
  date: string;
  account: string;
  debit: number;
  credit: number;
  description: string;
}

// Accounting Job List Item
export interface AccountingJobListItem {
  task_id: string;
  business_id: string;
  period_start: string;
  period_end: string;
  status: AccountingJobStatus;
  progress_percent: number;
  started_at?: string;
  completed_at?: string;
  journal_entries_count: number;
  reports_generated: number;
}

// Accounting Job Details
export interface AccountingJobDetails {
  task_id: string;
  business_id: string;
  period_start: string;
  period_end: string;
  status: AccountingJobStatus;
  progress_percent: number;
  started_at?: string;
  completed_at?: string;
  journal_entries_count: number;
  reports_generated: number;
}

// Create Accounting Job Response
export interface CreateAccountingJobResponse {
  success: boolean;
  data: {
    task_id: string;
    status: AccountingJobStatus;
    message: string;
    estimated_completion?: string;
  };
  message: string;
}

// List Accounting Jobs Response
export interface ListAccountingJobsResponse {
  success: boolean;
  data: AccountingJobListItem[];
  meta: {
    total: number;
  };
}

// Get Accounting Job Status Response
export interface GetAccountingJobStatusResponse {
  success: boolean;
  data: AccountingJobDetails;
}

// Accounting Job Results
export interface AccountingJobResults {
  task_id: string;
  business_id: string;
  period_start: string;
  period_end: string;
  status: AccountingJobStatus;
  total_revenue: number;
  total_expenses: number;
  gross_profit: number;
  net_profit: number;
  accounts_receivable: number;
  accounts_payable: number;
  cash_position: number;
  tax_calculations: TaxCalculation[];
  ai_insights: string;
  recommendations: string[];
  anomalies_detected: AnomalyDetected[];
  reports: AccountingReport[];
  journal_entries_preview: JournalEntryPreview[];
  total_journal_entries: number;
}

// Get Accounting Job Results Response
export interface GetAccountingJobResultsResponse {
  success: boolean;
  data: AccountingJobResults;
}

// Accounting History Task
export interface AccountingHistoryTask {
  task_id: string;
  period_start: string;
  period_end: string;
  status: AccountingJobStatus;
  completed_at?: string;
}

// Accounting History Response
export interface AccountingHistoryResponse {
  success: boolean;
  data: {
    business_id: string;
    tasks: AccountingHistoryTask[];
  };
}

// Financial Summary
export interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  gross_profit: number;
  net_profit: number;
  accounts_receivable: number;
  accounts_payable: number;
  cash_position: number;
}

// Accounting Period Work Log
export interface AccountingPeriodWorkLog {
  task_id: string;
  period_start: string;
  period_end: string;
  status: AccountingJobStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  journal_entries_count: number;
  tax_calculations_count: number;
  reports_count: number;
  has_ai_insights: boolean;
  recommendations_count: number;
  financial_summary: FinancialSummary;
}

// Work Log Summary
export interface WorkLogSummary {
  total_accounting_periods: number;
  completed: number;
  pending: number;
  processing: number;
  failed: number;
  total_journal_entries_generated: number;
  total_revenue_processed: number;
}

// Accounting Work Log Response
export interface AccountingWorkLogResponse {
  success: boolean;
  data: {
    business_id: string;
    database_name: string;
    summary: WorkLogSummary;
    accounting_periods: AccountingPeriodWorkLog[];
  };
}

// VAT Breakdown
export interface VatBreakdown {
  standard_rate_19_percent: number;
  reduced_rate_13_percent: number;
  reduced_rate_7_percent: number;
}

// Monthly Tax Detail
export interface MonthlyTaxDetail {
  month: number;
  period: string;
  vat_standard_19: number;
  vat_reduced_13: number;
  vat_reduced_7: number;
  vat_total: number;
  taxable_income: number;
  corporate_tax_due: number;
  withholding_tax: number;
  total_tax_liability: number;
  due_date: string;
}

// Tax Calendar Item
export interface TaxCalendarItem {
  period: string;
  due_date: string;
  description: string;
}

// Tax Summary
export interface TaxSummary {
  annual_vat_total: number;
  annual_corporate_tax: number;
  annual_withholding_tax: number;
  total_tax_liability: number;
}

// Tax Summary Response
export interface TaxSummaryResponse {
  success: boolean;
  data: {
    business_id: string;
    business_name: string;
    year: number;
    currency: string;
    summary: TaxSummary;
    vat_breakdown: VatBreakdown;
    monthly_details: MonthlyTaxDetail[];
    tax_calendar: TaxCalendarItem[];
    notes: string[];
  };
}

// Health Check Response
export interface AccountantHealthResponse {
  success: boolean;
  service: string;
  status: 'available' | 'unavailable';
}
