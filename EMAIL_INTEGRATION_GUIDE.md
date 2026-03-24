/**
 * Email Service Integration Guide
 * 
 * This file documents how to integrate the email sending functionality
 * with the accountia-api backend.
 */

// ============================================================================
// BACKEND API ENDPOINT REQUIREMENTS
// ============================================================================

/*
The accountia-api backend must expose an email sending endpoint:

Endpoint: POST /email/send

Expected Request Body:
{
  to: string;                              // Recipient email address
  subject: string;                         // Email subject line
  html: string;                            // HTML email content
  text: string;                            // Plain text email content
  type: 'business_approval' | 'business_rejection';
  metadata: {
    businessName: string;
    applicantEmail: string;
  }
}

Expected Response:
Success (200):
{
  "success": true,
  "messageId": "msg_123456789"  // Optional: Email service message ID
}

Error (4xx/5xx):
{
  "success": false,
  "error": "Error message describing what went wrong"
}

Example cURL:
curl -X POST http://localhost:8000/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "to": "applicant@example.com",
    "subject": "Your Business Application Has Been Approved",
    "html": "<html>...</html>",
    "text": "Plain text version...",
    "type": "business_approval",
    "metadata": {
      "businessName": "Acme Corp",
      "applicantEmail": "applicant@example.com"
    }
  }'
*/

// ============================================================================
// BACKEND API IMPLEMENTATION EXAMPLES
// ============================================================================

// ---- NESTJS IMPLEMENTATION ----
/*
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    try {
      const messageId = await this.emailService.send({
        to: sendEmailDto.to,
        subject: sendEmailDto.subject,
        html: sendEmailDto.html,
        text: sendEmailDto.text,
      });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
*/

// ---- FASTAPI IMPLEMENTATION ----
/*
from fastapi import APIRouter, Header, Depends, HTTPException
from email_service import EmailService
from auth import verify_token

router = APIRouter(prefix="/email", tags=["email"])

@router.post("/send")
async def send_email(
    email_data: SendEmailRequest,
    authorization: str = Header(None),
    email_service: EmailService = Depends()
):
    # Verify authentication
    user = await verify_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        message_id = await email_service.send(
            to=email_data.to,
            subject=email_data.subject,
            html=email_data.html,
            text=email_data.text
        )
        
        return {
            "success": True,
            "messageId": message_id
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
*/

// ---- PYTHON DJANGO IMPLEMENTATION ----
/*
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import EmailMultiAlternatives
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_email(request):
    try:
        data = request.data
        
        email = EmailMultiAlternatives(
            subject=data.get('subject'),
            body=data.get('text'),
            from_email='noreply@accountia.com',
            to=[data.get('to')]
        )
        
        email.attach_alternative(data.get('html'), "text/html")
        message_id = email.send()
        
        return Response({
            'success': True,
            'messageId': message_id
        })
    except Exception as e:
        logger.error(f"Email sending failed: {str(e)}")
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
*/

// ============================================================================
// CLIENT-SIDE CONFIGURATION
// ============================================================================

/*
The client-side configuration is already set up in:
- actions/email.ts: Email sending functions
- lib/email-templates.ts: Email template generators

If your backend API is hosted at a different URL, update the env.js:

env.js:
{
  "server": {
    "BACKEND_API_URL": z.string().url(),  // Add if needed
  },
  "client": {
    "NEXT_PUBLIC_BACKEND": z.url(),  // Already configured
  }
}

The createAuthenticatedClient() function in lib/requests.ts
automatically uses the NEXT_PUBLIC_BACKEND environment variable.
*/

// ============================================================================
// TESTING THE EMAIL ENDPOINT
// ============================================================================

/*
Manual Testing Steps:

1. Get a valid JWT token from your authentication system
   POST /auth/login
   → Returns: { "accessToken": "eyJhbGc..." }

2. Test the email endpoint with curl:
   curl -X POST http://your-api.com/email/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer eyJhbGc..." \
     -d '{
       "to": "test@example.com",
       "subject": "Test Email",
       "html": "<p>This is a test</p>",
       "text": "This is a test",
       "type": "business_approval",
       "metadata": {
         "businessName": "Test Business",
         "applicantEmail": "test@example.com"
       }
     }'

3. Expected Success Response (200):
   {
     "success": true,
     "messageId": "msg_abc123"
   }

4. Test with valid business approval email:
   curl -X POST http://your-api.com/email/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer eyJhbGc..." \
     -d '{
       "to": "john@example.com",
       "subject": "Your Business Application Has Been Approved - Acme Corp",
       "html": "[Full HTML from email template]",
       "text": "[Full text from email template]",
       "type": "business_approval",
       "metadata": {
         "businessName": "Acme Corp",
         "applicantEmail": "john@example.com"
       }
     }'
*/

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*
If emails are not being sent:

1. Verify Backend Configuration:
   - Check that email service is configured (SendGrid, SMTP, etc.)
   - Verify API endpoint is deployed and accessible
   - Check server logs for errors

2. Debugging Email Sending:
   In actions/email.ts, check the error console:
   - "Failed to send approval email: [error message]"
   - "Failed to send rejection email: [error message]"

3. Common Issues:
   a) Authentication Failed
      - Error: 401 Unauthorized
      - Solution: Verify JWT token is valid and included in header
   
   b) Email Service Not Configured
      - Error: "SMTP connection failed" or similar
      - Solution: Check backend email service configuration
   
   c) Invalid Email Address
      - Error: "Invalid recipient email"
      - Solution: Ensure applicantEmail is included in application data
   
   d) Network Timeout
      - Error: Connection refused or timeout
      - Solution: Check backend API URL in NEXT_PUBLIC_BACKEND env variable

4. Enable Debug Logging:
   In actions/email.ts, add console.log for debugging:
   console.log('Sending approval email to:', params.applicantEmail);
   console.log('Response:', response);
*/

// ============================================================================
// INTEGRATION WITH EXISTING SYSTEMS
// ============================================================================

/*
If your accountia-api already has an email sending system:

1. Update the endpoint paths in actions/email.ts:
   // Change from:
   const response = await client.post('email/send', {...})
   
   // To your existing endpoint:
   const response = await client.post('notifications/send-email', {...})

2. If your request/response format is different:
   - Modify the JSON structure in actions/email.ts
   - Adjust error handling to match your API responses

3. If email fields are already in business applications:
   - The types/ResponseInterfaces.ts is already updated
   - No additional changes needed

4. For database synchronization:
   - Email sent status can be logged on backend
   - Consider adding sent_at and sent_status fields to emails table
*/

// ============================================================================
// ADVANCED: IMPLEMENTING RETRIES & RATE LIMITING
// ============================================================================

/*
For production, consider adding retry logic:

export async function sendBusinessApprovalEmailWithRetry(
  params: SendApprovalEmailParams,
  maxRetries = 3,
  delayMs = 1000
): Promise<EmailSendResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendBusinessApprovalEmail(params);
      if (result.success) return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, delayMs * Math.pow(2, attempt - 1))
      );
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}
*/

// ============================================================================
// MONITORING & LOGGING
// ============================================================================

/*
For production monitoring:

1. Log all email sends in the database:
   - Store email_type, recipient, sent_at, status
   - Create EmailLog table in database

2. Monitor email delivery:
   - Track bounce rates
   - Monitor failed sends
   - Alert on high failure rates

3. Use email service webhooks:
   - SendGrid, Mailgun, AWS SES support delivery webhooks
   - Update email status in real-time

4. Example webhook handler (in backend):
   POST /email/webhook/delivery-status
   {
     "email_id": "msg_abc123",
     "status": "delivered|bounced|opened|clicked",
     "timestamp": "2026-03-23T10:00:00Z"
   }
*/

export default {
  // This file is for documentation only
  // Actual implementation is in actions/email.ts
};
