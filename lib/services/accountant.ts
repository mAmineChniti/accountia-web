import type {
  CreateAccountingJobInput,
  ListAccountingJobsQuery,
  GetJobStatusParams,
  GetJobStatusQuery,
  GetJobResultsParams,
  GetJobResultsQuery,
  CancelJobParams,
  CancelJobQuery,
  GetAccountingHistoryQuery,
  GetAllAccountantWorkQuery,
  GetTaxesQuery,
  CalculateTaxesQuery,
} from '@/types/services';
import type {
  CreateAccountingJobResponseDto,
  ListAccountingJobsResponseDto,
  GetJobStatusResponseDto,
  GetJobResultsResponseDto,
  CancelAccountingJobResponseDto,
  GetAccountingHistoryResponseDto,
  GetAllAccountantWorkResponseDto,
  TunisianTaxSummaryResponseDto,
  CalculateTaxResponseDto,
  AccountantHealthResponseDto,
} from '@/types/services';

import {
  createAuthenticatedClient,
  publicClient,
  API_CONFIG,
} from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const AccountantService = {
  async createJob(
    payload: CreateAccountingJobInput
  ): Promise<CreateAccountingJobResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.ACCOUNTANT.CREATE_JOB, { json: payload })
        .json<CreateAccountingJobResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async listJobs(
    params?: ListAccountingJobsQuery
  ): Promise<ListAccountingJobsResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {};
      if (params?.businessId != undefined)
        searchParams.businessId = params.businessId;
      if (params?.limit != undefined) searchParams.limit = params.limit;
      const result = await client
        .get(API_CONFIG.ACCOUNTANT.LIST_JOBS, { searchParams })
        .json<ListAccountingJobsResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getJobStatus(
    params: GetJobStatusParams,
    query?: GetJobStatusQuery
  ): Promise<GetJobStatusResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.ACCOUNTANT.GET_JOB.replace(
        '{taskId}',
        encodeURIComponent(params.taskId)
      );
      const searchParams: Record<string, string> = {};
      if (query?.businessId != undefined)
        searchParams.businessId = query.businessId;
      const result = await client
        .get(endpoint, { searchParams })
        .json<GetJobStatusResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getJobResults(
    params: GetJobResultsParams,
    query?: GetJobResultsQuery
  ): Promise<GetJobResultsResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.ACCOUNTANT.GET_JOB_RESULTS.replace(
        '{taskId}',
        encodeURIComponent(params.taskId)
      );
      const searchParams: Record<string, string> = {};
      if (query?.businessId != undefined)
        searchParams.businessId = query.businessId;
      const result = await client
        .get(endpoint, { searchParams })
        .json<GetJobResultsResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async cancelJob(
    params: CancelJobParams,
    query?: CancelJobQuery
  ): Promise<CancelAccountingJobResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.ACCOUNTANT.CANCEL_JOB.replace(
        '{taskId}',
        encodeURIComponent(params.taskId)
      );
      const searchParams: Record<string, string> = {};
      if (query?.businessId != undefined)
        searchParams.businessId = query.businessId;
      const result = await client
        .delete(endpoint, { searchParams })
        .json<CancelAccountingJobResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getHistory(
    params?: GetAccountingHistoryQuery
  ): Promise<GetAccountingHistoryResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {};
      if (params?.businessId != undefined)
        searchParams.businessId = params.businessId;
      if (params?.limit != undefined) searchParams.limit = params.limit;
      const result = await client
        .get(API_CONFIG.ACCOUNTANT.GET_HISTORY, { searchParams })
        .json<GetAccountingHistoryResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getWork(
    params?: GetAllAccountantWorkQuery
  ): Promise<GetAllAccountantWorkResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = {};
      if (params?.businessId != undefined)
        searchParams.businessId = params.businessId;
      if (params?.startDate != undefined)
        searchParams.startDate =
          params.startDate instanceof Date
            ? params.startDate.toISOString()
            : params.startDate;
      if (params?.endDate != undefined)
        searchParams.endDate =
          params.endDate instanceof Date
            ? params.endDate.toISOString()
            : params.endDate;
      if (params?.status != undefined) searchParams.status = params.status;
      const result = await client
        .get(API_CONFIG.ACCOUNTANT.GET_WORK, { searchParams })
        .json<GetAllAccountantWorkResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getTaxes(
    params: GetTaxesQuery
  ): Promise<TunisianTaxSummaryResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {};
      if (params.businessId != undefined)
        searchParams.businessId = params.businessId;
      if (params.year != undefined) searchParams.year = params.year;
      const result = await client
        .get(API_CONFIG.ACCOUNTANT.GET_TAXES, { searchParams })
        .json<TunisianTaxSummaryResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async calculateTaxes(
    params: CalculateTaxesQuery
  ): Promise<CalculateTaxResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {};
      if (params.businessId != undefined)
        searchParams.businessId = params.businessId;
      if (params.year != undefined) searchParams.year = params.year;
      const result = await client
        .post(API_CONFIG.ACCOUNTANT.CALCULATE_TAXES, { searchParams })
        .json<CalculateTaxResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
  async health(): Promise<AccountantHealthResponseDto> {
    try {
      const result = await publicClient
        .get(API_CONFIG.ACCOUNTANT.HEALTH)
        .json<AccountantHealthResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
