import { type BaseResponse } from './sharedTypes';

export interface POLineItem {
  id?: string;
  productId?: string;
  productName: string;
  orderedQuantity: number;
  receivedQuantity?: number;
  unitPrice: number;
  amount: number;
  description?: string;
}

export interface PurchaseOrder {
  id: string;
  businessId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'closed' | 'cancelled';
  lineItems: POLineItem[];
  totalAmount: number;
  currency: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedAt?: string;
  notes?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  lastStatusChangeAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderResponse = BaseResponse & PurchaseOrder;

export interface PurchaseOrderListResponse extends BaseResponse {
  purchaseOrders: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
