export type AccountantJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface CreateAccountingJobResponseDto {
  message: string;
  timestamp: string;
  job: {
    taskId: string;
    status: AccountantJobStatus;
    message?: string;
    estimatedCompletion?: string;
  };
}

export interface AccountantJobSummaryDto {
  taskId: string;
  periodStart: string;
  periodEnd: string;
  status: AccountantJobStatus;
  progressPercent?: number;
  startedAt?: string;
  completedAt?: string | null;
  journalEntriesCount?: number;
  reportsGenerated?: number;
}

export interface ListAccountingJobsResponseDto {
  message: string;
  timestamp: string;
  jobs: AccountantJobSummaryDto[];
  total: number;
}

export interface GetJobStatusResponseDto {
  message: string;
  timestamp: string;
  job: {
    taskId: string;
    businessId?: string;
    periodStart: string;
    periodEnd: string;
    status: AccountantJobStatus;
    progressPercent: number;
    startedAt?: string;
    completedAt?: string | null;
    journalEntriesCount?: number;
    reportsGenerated?: number;
  };
}

export interface TaxCalculationDto {
  taxType: string;
  jurisdiction?: string;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  notes?: string;
}

export interface AnomalyDto {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ReportDto {
  reportType: string;
  periodStart: string;
  periodEnd: string;
  data: Record<string, unknown>;
}

export interface JournalEntryDto {
  date?: string;
  account?: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface GetJobResultsResponseDto {
  message: string;
  timestamp: string;
  results: {
    taskId: string;
    businessId?: string;
    status: AccountantJobStatus;
    periodStart?: string;
    periodEnd?: string;
    totalRevenue?: number;
    totalExpenses?: number;
    grossProfit?: number;
    netProfit?: number;
    accountsReceivable?: number;
    accountsPayable?: number;
    cashPosition?: number;
    taxCalculations?: TaxCalculationDto[];
    aiInsights?: string;
    recommendations?: string[];
    anomaliesDetected?: AnomalyDto[];
    reports?: ReportDto[];
    journalEntriesPreview?: JournalEntryDto[];
    totalJournalEntries?: number;
  };
}

export interface CancelAccountingJobResponseDto {
  message: string;
  timestamp: string;
  result: {
    taskId: string;
    status: AccountantJobStatus;
    message?: string;
    previousStatus?: AccountantJobStatus;
  };
}

export interface AccountingHistoryTaskDto {
  taskId: string;
  periodStart: string;
  periodEnd: string;
  status: AccountantJobStatus;
  completedAt?: string;
}

export interface GetAccountingHistoryResponseDto {
  message: string;
  timestamp: string;
  businessId: string;
  tasks: AccountingHistoryTaskDto[];
}

export interface FinancialSummaryDto {
  totalRevenue?: number;
  totalExpenses?: number;
  grossProfit?: number;
  netProfit?: number;
  accountsReceivable?: number;
  accountsPayable?: number;
  cashPosition?: number;
}

export interface AccountantWorkPeriodDto {
  taskId: string;
  periodStart: string;
  periodEnd: string;
  status: AccountantJobStatus;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  journalEntriesCount?: number;
  taxCalculationsCount?: number;
  reportsCount?: number;
  hasAiInsights?: boolean;
  recommendationsCount?: number;
  financialSummary?: FinancialSummaryDto;
}

export interface GetAllAccountantWorkResponseDto {
  message: string;
  timestamp: string;
  work: {
    businessId: string;
    databaseName?: string;
    summary?: {
      totalAccountingPeriods?: number;
      completed?: number;
      pending?: number;
      processing?: number;
      failed?: number;
      totalJournalEntriesGenerated?: number;
      totalRevenueProcessed?: number;
    };
    accountingPeriods?: AccountantWorkPeriodDto[];
  };
}

export interface MonthlyTaxDetailDto {
  month: number;
  period: string;
  vatStandard19?: number;
  vatReduced13?: number;
  vatReduced7?: number;
  vatTotal?: number;
  taxableIncome?: number;
  corporateTaxDue?: number;
  withholdingTax?: number;
  totalTaxLiability?: number;
  dueDate?: string;
}

export interface TaxCalendarItemDto {
  period: string;
  dueDate?: string;
  description?: string;
}

export interface TunisianTaxSummaryResponseDto {
  message: string;
  timestamp: string;
  taxes: {
    businessId: string;
    businessName?: string;
    year: number;
    currency?: string;
    summary?: {
      annualVatTotal?: number;
      annualCorporateTax?: number;
      annualWithholdingTax?: number;
      totalTaxLiability?: number;
    };
    vatBreakdown?: {
      standardRate19Percent?: number;
      reducedRate13Percent?: number;
      reducedRate7Percent?: number;
    };
    monthlyDetails?: MonthlyTaxDetailDto[];
    taxCalendar?: TaxCalendarItemDto[];
    notes?: string[];
  };
}

export type TaxSummaryDto = TunisianTaxSummaryResponseDto['taxes']['summary'];

export interface CalculateTaxResponseDto {
  message: string;
  timestamp: string;
  result: {
    businessId: string;
    businessName?: string;
    year: number;
    summary: TaxSummaryDto | undefined;
    message?: string;
  };
}

export interface AccountantHealthResponseDto {
  success: boolean;
  service: string;
  status: 'available' | 'unavailable' | (string & {});
}
