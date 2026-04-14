import type { CreateProductInput, UpdateProductInput } from '@/types/services';
import type {
  ProductListResponse,
  CreateProductResponse,
  ProductDetailResponse,
  UpdateProductResponse,
  ProductImportResponse,
} from '@/types/services';
import { createAuthenticatedClient, API_CONFIG } from '@/lib/requests';
import { handleServiceError } from '@/lib/services/service-error';

export const ProductsService = {
  async getProducts(
    page: number = 1,
    limit: number = 10,
    businessId?: string,
    search?: string
  ): Promise<ProductListResponse> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string | number> = { page, limit };
      if (businessId) {
        searchParams.businessId = businessId;
      }
      if (search) {
        searchParams.search = search;
      }

      const result = await client
        .get(API_CONFIG.PRODUCTS.LIST, {
          searchParams,
        })
        .json<ProductListResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async createProduct(
    data: CreateProductInput
  ): Promise<CreateProductResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.PRODUCTS.CREATE, {
          json: data,
        })
        .json<CreateProductResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async getProductById(
    id: string,
    businessId: string
  ): Promise<ProductDetailResponse> {
    // Validate businessId before constructing endpoint
    if (
      !businessId ||
      typeof businessId !== 'string' ||
      businessId.trim() === ''
    ) {
      throw new Error('Invalid businessId: must be a non-empty string');
    }
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(API_CONFIG.PRODUCTS.GET.replace('{id}', id), { searchParams })
        .json<ProductDetailResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async updateProduct(
    id: string,
    data: UpdateProductInput
  ): Promise<UpdateProductResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .patch(API_CONFIG.PRODUCTS.UPDATE.replace('{id}', id), {
          json: data,
        })
        .json<UpdateProductResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async deleteProduct(id: string, businessId: string): Promise<void> {
    if (
      !businessId ||
      typeof businessId !== 'string' ||
      businessId.trim() === ''
    ) {
      throw new Error('Invalid businessId: must be a non-empty string');
    }

    const client = createAuthenticatedClient();
    try {
      await client.delete(API_CONFIG.PRODUCTS.DELETE.replace('{id}', id), {
        json: { businessId },
        searchParams: { businessId },
      });
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async importProducts(
    file: File,
    businessId: string
  ): Promise<ProductImportResponse> {
    if (
      !businessId ||
      typeof businessId !== 'string' ||
      businessId.trim() === ''
    ) {
      throw new Error('Invalid businessId: must be a non-empty string');
    }

    const client = createAuthenticatedClient();
    try {
      const formData = new FormData();
      formData.append('file', file);
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .post(API_CONFIG.PRODUCTS.IMPORT, { body: formData, searchParams })
        .json<ProductImportResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async importProductsAi(
    file: File,
    businessId: string
  ): Promise<ProductImportResponse> {
    const client = createAuthenticatedClient();
    try {
      const formData = new FormData();
      formData.append('file', file);
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .post('products/import-ai', { body: formData, searchParams })
        .json<ProductImportResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async importProductsSmart(
    file: File,
    businessId: string
  ): Promise<ProductImportResponse> {
    const client = createAuthenticatedClient();
    try {
      const formData = new FormData();
      formData.append('file', file);
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .post(API_CONFIG.PRODUCTS.IMPORT_SMART, {
          body: formData,
          searchParams,
          timeout: 60_000, // AI mapping might take some time
        })
        .json<ProductImportResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },

  async generateAiReport(
    businessId: string,
    lang?: string
  ): Promise<{ summary: string }> {
    const client = createAuthenticatedClient();
    try {
      const searchParams: Record<string, string> = { businessId };
      if (lang) {
        searchParams.lang = lang;
      }
      const result = await client
        .get('products/export-ai', {
          searchParams,
          timeout: 60_000, // 60 seconds timeout to allow Gemini to finish generating
        })
        .json<{ summary: string }>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
