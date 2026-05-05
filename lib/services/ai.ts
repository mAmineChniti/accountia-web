import { createAuthenticatedClient } from '../requests';
import { handleServiceError } from './service-error';

export interface AiInvoiceAnalysisResponse {
  recipient: {
    displayName: string;
    email: string;
  };
  issuedDate: string;
  dueDate: string;
  currency: string;
  description: string;
  lineItems: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    description: string;
  }>;
}

export const AiService = {
  async analyzeInvoice(file: File): Promise<AiInvoiceAnalysisResponse> {
    const client = createAuthenticatedClient();
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await client
        .post('ai/analyze-invoice', {
          body: formData,
        })
        .json<AiInvoiceAnalysisResponse>();
      return result;
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
};
