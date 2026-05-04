import { type BaseResponse } from './sharedTypes';

export interface Vendor {
  id: string;
  businessId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  website?: string;
  paymentTermsDays: number;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
  totalOrders: number;
  totalSpend: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export type VendorResponse = BaseResponse & Vendor;

export interface VendorListResponse extends BaseResponse {
  vendors: Vendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
