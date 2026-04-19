import type {
  CreateAccountingJobInput,
  CreateAccountingJobResponse,
  ListAccountingJobsResponse,
  GetAccountingJobStatusResponse,
  GetAccountingJobResultsResponse,
  AccountingHistoryResponse,
  AccountingWorkLogResponse,
  TaxSummaryResponse,
  AccountantHealthResponse,
} from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const AccountantService = {
  async createJob(
    businessId: string,
    data: CreateAccountingJobInput
  ): Promise<CreateAccountingJobResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.ACCOUNTANT.CREATE_JOB, {
          json: { ...data, businessId },
        })
        .json<CreateAccountingJobResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async listJobs(
    businessId: string,
    status?: 'pending' | 'processing' | 'completed' | 'failed',
    limit?: number
  ): Promise<ListAccountingJobsResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = { businessId };
      if (status) {
        searchParams.status = status;
      }
      if (limit !== undefined) {
        searchParams.limit = limit;
      }
      const result = await client
        .get(API_CONFIG.ACCOUNTANT.LIST_JOBS, { searchParams })
        .json<ListAccountingJobsResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getJobStatus(
    businessId: string,
    taskId: string
  ): Promise<GetAccountingJobStatusResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(
          API_CONFIG.ACCOUNTANT.GET_JOB.replace(
            '{taskId}',
            encodeURIComponent(taskId)
          ),
          { searchParams: { businessId } }
        )
        .json<GetAccountingJobStatusResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getJobResults(
    businessId: string,
    taskId: string
  ): Promise<GetAccountingJobResultsResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(
          API_CONFIG.ACCOUNTANT.GET_JOB_RESULTS.replace(
            '{taskId}',
            encodeURIComponent(taskId)
          ),
          { searchParams: { businessId } }
        )
        .json<GetAccountingJobResultsResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getHistory(
    businessId: string,
    limit?: number
  ): Promise<AccountingHistoryResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = { businessId };
      if (limit !== undefined) {
        searchParams.limit = limit;
      }
      const result = await client
        .get(API_CONFIG.ACCOUNTANT.GET_HISTORY, { searchParams })
        .json<AccountingHistoryResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getWork(
    businessId: string,
    startDate?: string,
    endDate?: string,
    status?: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<AccountingWorkLogResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = { businessId };
      if (startDate) {
        searchParams.start_date = startDate;
      }
      if (endDate) {
        searchParams.end_date = endDate;
      }
      if (status) {
        searchParams.status = status;
      }
      const result = await client
        .get(API_CONFIG.ACCOUNTANT.GET_WORK, { searchParams })
        .json<AccountingWorkLogResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getTaxes(
    businessId: string,
    year?: number
  ): Promise<TaxSummaryResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = { businessId };
      if (year !== undefined) {
        searchParams.year = year;
      }
      const result = await client
        .get(API_CONFIG.ACCOUNTANT.GET_TAXES, { searchParams })
        .json<TaxSummaryResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async health(): Promise<AccountantHealthResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(API_CONFIG.ACCOUNTANT.HEALTH)
        .json<AccountantHealthResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
