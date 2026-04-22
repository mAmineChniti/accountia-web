import type {
  CreateAccountingJobInput,
  CreateAccountingJobWrapper,
  ListAccountingJobsResponse,
  AccountingJobStatus,
  AccountingJobDetailsWrapper,
  GetAccountingJobResultsWrapper,
  AccountingHistoryWrapper,
  AccountingWorkLogWrapper,
  TaxSummaryWrapper,
  AccountantHealthResponse,
  CancelJobWrapper,
} from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const AccountantService = {
  // Helper to unwrap API responses that are wrapped as { success: true, data: T }
  _unwrap<T>(res: unknown): T {
    if (
      res &&
      typeof res === 'object' &&
      'success' in (res as Record<string, unknown>) &&
      'data' in (res as Record<string, unknown>)
    ) {
      const obj = res as Record<string, unknown>;
      return obj.data as T;
    }
    return res as T;
  },
  async createJob(
    data: CreateAccountingJobInput
  ): Promise<CreateAccountingJobWrapper> {
    const client = createAuthenticatedClient();
    try {
      // businessId is now part of CreateAccountingJobInput per new API docs
      const result = await client
        .post(API_CONFIG.ACCOUNTANT.CREATE_JOB, {
          json: data,
        })
        .json<CreateAccountingJobWrapper>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async listJobs(
    businessId: string,
    status?: AccountingJobStatus,
    limit?: number
  ): Promise<ListAccountingJobsResponse> {
    const client = createAuthenticatedClient();
    try {
      // Controller expects camelCase businessId
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
  ): Promise<AccountingJobDetailsWrapper> {
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
        .json<AccountingJobDetailsWrapper>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getJobResults(
    businessId: string,
    taskId: string
  ): Promise<GetAccountingJobResultsWrapper> {
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
        .json<GetAccountingJobResultsWrapper>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getHistory(
    businessId: string,
    limit?: number
  ): Promise<AccountingHistoryWrapper> {
    const client = createAuthenticatedClient();
    try {
      const url = API_CONFIG.ACCOUNTANT.GET_HISTORY.replace(
        '{businessId}',
        encodeURIComponent(businessId)
      );
      const searchParams: Record<string, string | number> = {};
      if (limit !== undefined) searchParams.limit = limit;
      const result = await client
        .get(url, { searchParams })
        .json<AccountingHistoryWrapper>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getWork(
    businessId: string,
    startDate?: string,
    endDate?: string,
    status?: AccountingJobStatus
  ): Promise<AccountingWorkLogWrapper> {
    const client = createAuthenticatedClient();
    try {
      const url = API_CONFIG.ACCOUNTANT.GET_WORK.replace(
        '{businessId}',
        encodeURIComponent(businessId)
      );
      const searchParams: Record<string, string> = {};
      if (startDate) searchParams.start_date = startDate;
      if (endDate) searchParams.end_date = endDate;
      if (status) searchParams.status = status;
      const result = await client
        .get(url, { searchParams })
        .json<AccountingWorkLogWrapper>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getTaxes(businessId: string, year: number): Promise<TaxSummaryWrapper> {
    const client = createAuthenticatedClient();
    try {
      const url = API_CONFIG.ACCOUNTANT.GET_TAXES;
      const searchParams: Record<string, string | number> = {
        businessId,
        year,
      };
      const result = await client
        .get(url, { searchParams })
        .json<TaxSummaryWrapper>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async cancelJob(
    businessId: string,
    taskId: string
  ): Promise<CancelJobWrapper> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .delete(
          API_CONFIG.ACCOUNTANT.GET_JOB.replace(
            '{taskId}',
            encodeURIComponent(taskId)
          ),
          { searchParams: { businessId } }
        )
        .json<CancelJobWrapper>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async health(businessId?: string): Promise<AccountantHealthResponse> {
    const client = createAuthenticatedClient();
    try {
      // Some backends require businessId on all /accountant/* routes
      const searchParams: Record<string, string> = {};
      if (businessId) {
        searchParams.businessId = businessId;
      }
      const url = API_CONFIG.ACCOUNTANT.HEALTH;

      const response = await client.get(url, {
        searchParams:
          Object.keys(searchParams).length > 0 ? searchParams : undefined,
      });
      const result = await response.json<AccountantHealthResponse>();
      return result;
    } catch {
      // Return unavailable on any error per API docs
      return {
        success: false,
        service: 'ai-accountant',
        status: 'unavailable',
      };
    }
  },
};
