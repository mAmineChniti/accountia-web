import type {
  CreateAccountingJobInput,
  ListAccountingJobsQuery,
  GetJobResultsParams,
  GetJobResultsQuery,
  GetTaxesQuery,
  CalculateTaxesQuery,
} from '@/types/services';
import type {
  CreateAccountingJobResponseDto,
  ListAccountingJobsResponseDto,
  GetJobResultsResponseDto,
  TunisianTaxSummaryResponseDto,
  CalculateTaxResponseDto,
  AccountantHealthResponseDto,
} from '@/types/services';

import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
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
      if (!params?.businessId) {
        throw new Error('businessId is required for listing jobs');
      }
      searchParams.businessId = params.businessId as string;
      if (params?.status != undefined) searchParams.status = params.status;
      if (params?.limit != undefined) searchParams.limit = params.limit;
      const result = await client
        .get(API_CONFIG.ACCOUNTANT.LIST_JOBS, { searchParams })
        .json<ListAccountingJobsResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  // The backend exposes a single GET /accountant/jobs/:taskId route
  // which returns either job status while processing or full results
  // when completed. Use `getJobResults` for that purpose.

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
      if (query?.businessId == undefined) {
        throw new Error('businessId is required for getting job results');
      } else {
        searchParams.businessId = query.businessId;
      }
      const result = await client
        .get(endpoint, { searchParams })
        .json<GetJobResultsResponseDto>();
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
      if (!params.businessId)
        throw new Error('businessId is required for getting taxes');
      if (params.year == undefined)
        throw new Error('year is required for getting taxes');
      const endpoint = API_CONFIG.ACCOUNTANT.GET_TAXES.replace(
        '{year}',
        encodeURIComponent(String(params.year))
      );
      const searchParams: Record<string, string | number> = {
        businessId: params.businessId as string,
      };
      const result = await client
        .get(endpoint, { searchParams })
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
      if (!params.businessId)
        throw new Error('businessId is required for calculating taxes');
      if (params.year == undefined)
        throw new Error('year is required for calculating taxes');
      const endpoint = API_CONFIG.ACCOUNTANT.CALCULATE_TAXES.replace(
        '{year}',
        encodeURIComponent(String(params.year))
      );
      const searchParams: Record<string, string | number> = {
        businessId: params.businessId as string,
      };
      const result = await client
        .post(endpoint, { searchParams })
        .json<CalculateTaxResponseDto>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
  async health(): Promise<AccountantHealthResponseDto> {
    const client = createAuthenticatedClient();
    try {
      const resp = await client.get(API_CONFIG.ACCOUNTANT.HEALTH, {
        throwHttpErrors: false,
      });
      const body = await resp
        .json<AccountantHealthResponseDto>()
        .catch(() => ({}) as AccountantHealthResponseDto);
      return body;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
