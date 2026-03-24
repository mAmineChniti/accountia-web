# Business Application Approval/Rejection Workflow

## Overview

This document describes the complete workflow for approving and rejecting business applications in the Accountia platform, including email notifications and date filtering capabilities.

## Features Implemented

### 1. Email Notifications

#### Approval Email
When an admin approves a business application:
- The applicant receives an automated approval confirmation email
- The email contains professional HTML and plain text versions
- Includes business details and success message
- Motivates the applicant to start using the platform

**Email Content:**
- Subject: `Your Business Application Has Been Approved - [Business Name]`
- Greeting with applicant name
- Confirmation of approval status
- Business information summary
- Call to action for dashboard access
- Professional footer with copyright

#### Rejection Email
When an admin rejects a business application:
- The applicant receives a notification with the rejection reason
- The email explains why the application was rejected
- Provides constructive feedback for reapplication
- Supports contact with support team

**Email Content:**
- Subject: `Update on Your Business Application - [Business Name]`
- Professional notification of rejection
- Rejection reason (from admin notes)
- Encouragement to reapply with improvements
- Support contact information

### 2. Date Range Filtering

Business applications can now be filtered by date range:
- **From Date:** Filter applications submitted on or after this date
- **To Date:** Filter applications submitted on or before this date
- **Combination:** Filter for applications within a specific date range

#### Implementation Details

The date filtering is client-side and works by:
1. Converting date inputs to JavaScript Date objects
2. Comparing application creation dates with filter dates
3. End-of-day time handling for accurate "to date" filtering

```typescript
// Example filtering logic
const fromDate = new Date(applicationDateFrom);
const toDate = new Date(applicationDateTo);
const endOfToDate = new Date(toDate);
endOfToDate.setHours(23, 59, 59, 999);

const filtered = applications.filter((app) => {
  const appDate = new Date(app.createdAt);
  return appDate >= fromDate && appDate <= endOfToDate;
});
```

### 3. Admin Dashboard Enhancements

#### Updated Components
- **BusinessManagement.tsx** - Enhanced with email sending and date filtering
- **Email Templates** - New email template generators in `lib/email-templates.ts`
- **Server Actions** - Email sending logic in `actions/email.ts`

#### UI Improvements
- Date input fields with calendar picker
- Clear date filter functionality
- Better visual organization of filters
- Responsive design for mobile devices

## File Structure

```
accountia-web/
├── actions/
│   └── email.ts                    # Server actions for sending emails
├── components/
│   └── Admin/
│       └── BusinessManagement.tsx  # Enhanced admin dashboard
├── lib/
│   └── email-templates.ts          # Email template generators
├── types/
│   └── ResponseInterfaces.ts       # Updated with email fields
├── dictionaries/
│   ├── en.json                     # English translations
│   └── fr.json                     # French translations
├── __tests__/
│   └── business-management.test.ts # Test suite
```

## API Integration

### Backend Email Endpoint

The email sending system calls the backend API at:
```
POST /email/send
```

**Request Payload:**
```typescript
{
  to: string;                        // Recipient email
  subject: string;                   // Email subject
  html: string;                      // HTML email content
  text: string;                      // Plain text version
  type: 'business_approval' | 'business_rejection';  // Email type
  metadata: {
    businessName: string;
    applicantEmail: string;
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  messageId?: string;                // Email service message ID
  error?: string;                    // Error message if failed
}
```

## Usage Guide

### Approving an Application

1. Navigate to the Business Management admin page
2. Find the pending application in the Business Applications list
3. Click the **Approve** button
4. The system will:
   - Update the application status to "approved"
   - Create a corresponding Business record
   - Send an approval email to the applicant
   - Refresh the dashboard

### Rejecting an Application

1. Navigate to the Business Management admin page
2. Find the pending application
3. Click the **Reject** button
4. A modal will appear requesting a reason for rejection
5. Enter the rejection reason (required)
6. Click **Reject** to confirm
7. The system will:
   - Update the application status to "rejected"
   - Send a rejection email with the reason
   - Display the rejection reason to the applicant
   - Refresh the dashboard

### Filtering Applications by Date

1. On the Business Management page, locate the date filter section
2. **Optional:** Enter a "From Date" to see applications after that date
3. **Optional:** Enter a "To Date" to see applications before that date
4. Click **Clear dates** to reset the filter
5. The application list will automatically update to show only matching applications

## Data Types

### BusinessApplicationItem
```typescript
interface BusinessApplicationItem {
  id: string;
  businessName: string;
  description: string;
  website?: string;
  phone: string;
  applicantId: string;
  applicantEmail?: string;           // NEW: For email notifications
  applicantName?: string;            // NEW: For personalized emails
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
```

## Error Handling

### Email Sending Failures
If email sending fails:
- The application review completes successfully
- An error log is recorded
- A warning message may be shown to the admin
- The applicant will not receive a notification

### Date Filtering Edge Cases
- Applications on the exact "from" date are included
- Applications on the exact "to" date are included
- Invalid date inputs are ignored
- Empty date fields are treated as no date restriction

## Testing

### Unit Tests
Run the test suite with:
```bash
npm test -- __tests__/business-management.test.ts
```

**Test Coverage:**
- Email template generation (HTML and text)
- Date filtering logic
- Edge case handling
- Email content validation

### Manual Testing Checklist

**Approval Flow:**
- [ ] Click approve button
- [ ] Application status changes to "Approved"
- [ ] Business appears in the Businesses list
- [ ] Approval email is sent (check email logs)
- [ ] Email contains correct business information

**Rejection Flow:**
- [ ] Click reject button
- [ ] Rejection modal appears
- [ ] Submit rejection with reason
- [ ] Application status changes to "Rejected"
- [ ] Rejection email is sent with reason
- [ ] Email displays rejection reason clearly

**Date Filtering:**
- [ ] Filter by from date only
- [ ] Filter by to date only
- [ ] Filter by date range
- [ ] Clear date filters
- [ ] Applications on boundary dates are included correctly

## Translations

### English (en.json)
```json
{
  "emailNotifications": {
    "approvalSent": "Approval email sent to applicant",
    "rejectionSent": "Rejection email sent to applicant",
    "emailError": "Application was reviewed but email notification could not be sent"
  }
}
```

### French (fr.json)
```json
{
  "emailNotifications": {
    "approvalSent": "Email d'approbation envoyé au demandeur",
    "rejectionSent": "Email de rejet envoyé au demandeur",
    "emailError": "La demande a été examinée mais la notification par email n'a pas pu être envoyée"
  }
}
```

## Deployment Notes

1. **Backend Requirements:**
   - Email service must be configured (SMTP, SendGrid, etc.)
   - `/email/send` endpoint must be implemented
   - Applicant email and name fields should be included in application responses

2. **Database:**
   - Ensure `BusinessApplicationItem` includes `applicantEmail` and `applicantName`
   - Add any necessary indices on `createdAt` for date filtering performance

3. **Environment Variables:**
   - No additional environment variables required
   - Email service configuration handled on backend

## Future Enhancements

### Planned Features
1. **Email Customization**
   - Allow admins to customize rejection reasons
   - Templates for different rejection types

2. **Audit Trail**
   - Log all approvals/rejections with timestamps
   - Track email delivery status

3. **Bulk Operations**
   - Approve/reject multiple applications at once
   - Schedule batch approvals

4. **Advanced Filtering**
   - Filter by applicant name or email
   - Filter by business category or tags
   - Saved filter presets

5. **Email Resend**
   - Allow admins to resend approval/rejection emails
   - Manual email trigger for support purposes

## Support & Troubleshooting

### Email Not Being Sent
1. Check that applicant has an email address
2. Verify backend `/email/send` endpoint is working
3. Check server logs for email service errors
4. Verify SMTP or email service credentials on backend

### Date Filter Not Working
1. Ensure dates are in YYYY-MM-DD format
2. Check browser console for JavaScript errors
3. Verify date comparison logic in component

### Application Status Not Updating
1. Check network requests in browser DevTools
2. Verify JWT token is valid
3. Check backend API response status
4. Confirm database permissions

## Contact & Questions

For questions about this workflow, contact the development team or check the main README file for more information.
