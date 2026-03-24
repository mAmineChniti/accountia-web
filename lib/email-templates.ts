/**
 * Email template generators for business application notifications
 */

interface BusinessApplicationEmailContext {
  businessName: string;
  applicantEmail: string;
  applicantName: string;
  businessDescription?: string;
  businessPhone?: string;
  reviewNotes?: string;
  applicationUrl?: string;
}

/**
 * Generate HTML for business approval email
 */
export function generateApprovalEmailHTML(
  context: BusinessApplicationEmailContext
): string {
  const { businessName, applicantName, businessDescription, applicationUrl } =
    context;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .email-wrapper {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px;
          }
          .success-badge {
            display: inline-block;
            background-color: #d1fae5;
            color: #065f46;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .business-info {
            background-color: #f3f4f6;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .business-info h3 {
            margin-top: 0;
            color: #333;
            font-size: 16px;
          }
          .business-info p {
            margin: 8px 0;
            font-size: 14px;
            color: #666;
          }
          .cta-button {
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 20px;
            cursor: pointer;
          }
          .cta-button:hover {
            background-color: #5568d3;
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding: 20px 40px;
            background-color: #f9fafb;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .divider {
            border-bottom: 1px solid #e5e7eb;
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <h1>✓ Application Approved</h1>
            </div>
            <div class="content">
              <div class="success-badge">APPROVED</div>
              
              <p>Hi ${applicantName},</p>
              
              <p>We're thrilled to inform you that your business application has been <strong>approved</strong>!</p>
              
              <div class="business-info">
                <h3>${businessName}</h3>
                ${businessDescription ? `<p><strong>Description:</strong> ${businessDescription}</p>` : ''}
                <p><strong>Status:</strong> Approved ✓</p>
              </div>
              
              <p>Your business is now active on our platform. You can start using all the features available to approved business owners.</p>
              
              ${
                applicationUrl
                  ? `<a href="${applicationUrl}" class="cta-button">View Your Business Dashboard</a>`
                  : ''
              }
              
              <div class="divider"></div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br><strong>Accountia Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Accountia. All rights reserved.</p>
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for business rejection email
 */
export function generateRejectionEmailHTML(
  context: BusinessApplicationEmailContext
): string {
  const { businessName, applicantName, reviewNotes } = context;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .email-wrapper {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px;
          }
          .rejection-badge {
            display: inline-block;
            background-color: #fee2e2;
            color: #991b1b;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .business-info {
            background-color: #f3f4f6;
            border-left: 4px solid #dc2626;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .business-info h3 {
            margin-top: 0;
            color: #333;
            font-size: 16px;
          }
          .business-info p {
            margin: 8px 0;
            font-size: 14px;
            color: #666;
          }
          .rejection-reason {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
          }
          .rejection-reason h4 {
            margin-top: 0;
            color: #92400e;
            font-size: 14px;
            font-weight: 600;
          }
          .rejection-reason p {
            margin: 8px 0;
            color: #78350f;
          }
          .cta-button {
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 20px;
            cursor: pointer;
          }
          .cta-button:hover {
            background-color: #5568d3;
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding: 20px 40px;
            background-color: #f9fafb;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .divider {
            border-bottom: 1px solid #e5e7eb;
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <h1>Application Not Approved</h1>
            </div>
            <div class="content">
              <div class="rejection-badge">NOT APPROVED</div>
              
              <p>Hi ${applicantName},</p>
              
              <p>Thank you for submitting your business application. After thorough review, we regret to inform you that your application has not been approved at this time.</p>
              
              <div class="business-info">
                <h3>${businessName}</h3>
                <p><strong>Status:</strong> Not Approved</p>
              </div>
              
              ${
                reviewNotes
                  ? `
                <div class="rejection-reason">
                  <h4>Reason for Rejection:</h4>
                  <p>${reviewNotes}</p>
                </div>
              `
                  : ''
              }
              
              <p>We encourage you to review the feedback provided above and consider reapplying once you've addressed the concerns raised.</p>
              
              <div class="divider"></div>
              
              <p>If you have questions about this decision or would like more information, please contact our support team.</p>
              
              <p>Best regards,<br><strong>Accountia Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Accountia. All rights reserved.</p>
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate plain text for business approval email
 */
export function generateApprovalEmailText(
  context: BusinessApplicationEmailContext
): string {
  const { businessName, applicantName, businessDescription } = context;

  return `
Application Approved

Dear ${applicantName},

We're thrilled to inform you that your business application has been approved!

Business: ${businessName}
${businessDescription ? `Description: ${businessDescription}` : ''}
Status: Approved ✓

Your business is now active on our platform. You can start using all the features available to approved business owners.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
Accountia Team

© 2026 Accountia. All rights reserved.
This is an automated email. Please do not reply directly to this message.
  `.trim();
}

/**
 * Generate plain text for business rejection email
 */
export function generateRejectionEmailText(
  context: BusinessApplicationEmailContext
): string {
  const { businessName, applicantName, reviewNotes } = context;

  return `
Application Not Approved

Dear ${applicantName},

Thank you for submitting your business application. After thorough review, we regret to inform you that your application has not been approved at this time.

Business: ${businessName}
Status: Not Approved

${
  reviewNotes
    ? `
Reason for Rejection:
${reviewNotes}
`
    : ''
}

We encourage you to review the feedback provided above and consider reapplying once you've addressed the concerns raised.

If you have questions about this decision or would like more information, please contact our support team.

Best regards,
Accountia Team

© 2026 Accountia. All rights reserved.
This is an automated email. Please do not reply directly to this message.
  `.trim();
}
