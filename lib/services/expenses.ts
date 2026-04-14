import type { CreateExpenseInput, UpdateExpenseInput, ReviewExpenseInput } from '@/types/services';
import type { ExpenseListResponse, ExpenseResponse, ExpenseSummaryResponse } from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const ExpensesService = {
  async getExpenses(params: {
    businessId: string;
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
  }): Promise<ExpenseListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = {
        businessId: params.businessId,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      };
      if (params.status) searchParams.status = params.status;
      if (params.category) searchParams.category = params.category;
      return await client.get(API_CONFIG.EXPENSES.LIST, { searchParams }).json<ExpenseListResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getSummary(businessId: string): Promise<ExpenseSummaryResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.get(API_CONFIG.EXPENSES.SUMMARY, { searchParams: { businessId } }).json<ExpenseSummaryResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getExpenseById(id: string, businessId: string): Promise<ExpenseResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client
        .get(API_CONFIG.EXPENSES.GET.replace('{id}', id), { searchParams: { businessId } })
        .json<ExpenseResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async createExpense(data: CreateExpenseInput): Promise<ExpenseResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.post(API_CONFIG.EXPENSES.CREATE, { json: data }).json<ExpenseResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async updateExpense(id: string, data: UpdateExpenseInput): Promise<ExpenseResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.patch(API_CONFIG.EXPENSES.UPDATE.replace('{id}', id), { json: data }).json<ExpenseResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async submitExpense(id: string, businessId: string): Promise<ExpenseResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client
        .patch(API_CONFIG.EXPENSES.SUBMIT.replace('{id}', id), { searchParams: { businessId } })
        .json<ExpenseResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async reviewExpense(id: string, data: ReviewExpenseInput): Promise<ExpenseResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client.patch(API_CONFIG.EXPENSES.REVIEW.replace('{id}', id), { json: data }).json<ExpenseResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async markReimbursed(id: string, businessId: string): Promise<ExpenseResponse> {
    const client = createAuthenticatedClient();
    try {
      return await client
        .patch(API_CONFIG.EXPENSES.REIMBURSE.replace('{id}', id), { searchParams: { businessId } })
        .json<ExpenseResponse>();
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async deleteExpense(id: string, businessId: string): Promise<void> {
    const client = createAuthenticatedClient();
    try {
      await client.delete(API_CONFIG.EXPENSES.DELETE.replace('{id}', id), { searchParams: { businessId } });
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
