'use server';

import {
  generateApprovalEmailHTML,
  generateApprovalEmailText,
  generateRejectionEmailHTML,
  generateRejectionEmailText,
} from '@/lib/email-templates';
import { createAuthenticatedClient } from '@/lib/requests';

interface SendApprovalEmailParams {
  applicantEmail: string;
  applicantName: string;
  businessName: string;
  businessDescription?: string;
  businessPhone?: string;
}

interface SendRejectionEmailParams {
  applicantEmail: string;
  applicantName: string;
  businessName: string;
  rejectionReason: string;
  businessPhone?: string;
}

interface EmailSendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send business approval confirmation email
 */
export async function sendBusinessApprovalEmail(
  params: SendApprovalEmailParams
): Promise<EmailSendResponse> {
  try {
    const htmlContent = generateApprovalEmailHTML({
      applicantEmail: params.applicantEmail,
      applicantName: params.applicantName,
      businessName: params.businessName,
      businessDescription: params.businessDescription,
      businessPhone: params.businessPhone,
    });

    const textContent = generateApprovalEmailText({
      applicantEmail: params.applicantEmail,
      applicantName: params.applicantName,
      businessName: params.businessName,
      businessDescription: params.businessDescription,
      businessPhone: params.businessPhone,
    });

    const client = createAuthenticatedClient();

    // Send email through backend API
    // Endpoint should be: POST /email/send
    // or /notifications/send-email
    // Adjust based on your actual backend API
    const response = await client
      .post('email/send', {
        json: {
          to: params.applicantEmail,
          subject: `Your Business Application Has Been Approved - ${params.businessName}`,
          html: htmlContent,
          text: textContent,
          type: 'business_approval',
          metadata: {
            businessName: params.businessName,
            applicantEmail: params.applicantEmail,
          },
        },
      })
      .json<{ success: boolean; messageId?: string }>();

    return {
      success: response.success,
      messageId: response.messageId,
    };
  } catch (error) {
    console.error('Failed to send approval email:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send business rejection notification email
 */
export async function sendBusinessRejectionEmail(
  params: SendRejectionEmailParams
): Promise<EmailSendResponse> {
  try {
    const htmlContent = generateRejectionEmailHTML({
      applicantEmail: params.applicantEmail,
      applicantName: params.applicantName,
      businessName: params.businessName,
      reviewNotes: params.rejectionReason,
      businessPhone: params.businessPhone,
    });

    const textContent = generateRejectionEmailText({
      applicantEmail: params.applicantEmail,
      applicantName: params.applicantName,
      businessName: params.businessName,
      reviewNotes: params.rejectionReason,
      businessPhone: params.businessPhone,
    });

    const client = createAuthenticatedClient();

    // Send email through backend API
    const response = await client
      .post('email/send', {
        json: {
          to: params.applicantEmail,
          subject: `Update on Your Business Application - ${params.businessName}`,
          html: htmlContent,
          text: textContent,
          type: 'business_rejection',
          metadata: {
            businessName: params.businessName,
            applicantEmail: params.applicantEmail,
          },
        },
      })
      .json<{ success: boolean; messageId?: string }>();

    return {
      success: response.success,
      messageId: response.messageId,
    };
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
