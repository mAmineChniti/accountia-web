import { type BaseResponse } from './sharedTypes';

export interface VatLineItem {
  productName: string;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
}

export interface VatInvoice {
  invoiceId: string;
  invoiceNumber: string;
  issuedDate: string;
  recipientName: string;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  status: string;
  lineItems: VatLineItem[];
}

export interface VatRateSummary {
  rate: number;
  netAmount: number;
  vatAmount: number;
  count: number;
}

export interface VatReportResponse extends BaseResponse {
  businessId: string;
  period: string;
  startDate: string;
  endDate: string;
  totalOutputVat: number;
  totalInputVat: number;
  netVatPayable: number;
  totalTaxableRevenue: number;
  byRate: VatRateSummary[];
  invoices: VatInvoice[];
}
