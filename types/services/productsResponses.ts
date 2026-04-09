import { type BaseResponse } from './sharedTypes';

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  unitPrice: number;
  cost: number;
  quantity: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

export type CreateProductResponse = BaseResponse & Product;

export interface ProductListResponse extends BaseResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ProductDetailResponse = BaseResponse & Product;

export type UpdateProductResponse = BaseResponse & Product;

export interface ProductImportResponse extends BaseResponse {
  imported: number;
  failed: number;
  skipped?: number;
  errors: string[];
}

export type ProductMessageResponse = BaseResponse;

export type ProductResponseDto = BaseResponse & Product;

export interface ProductListResponseDto extends BaseResponse {
  products: ProductResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
