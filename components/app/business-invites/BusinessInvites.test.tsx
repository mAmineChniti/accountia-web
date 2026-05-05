/* eslint-disable */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BusinessInvites from './BusinessInvites';
import { BusinessService } from '@/lib/requests';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/requests', () => ({
  BusinessService: {
    getBusinessInvites: jest.fn(),
    inviteBusinessUser: jest.fn(),
    resendInvite: jest.fn(),
    revokeInvite: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockDictionary: any = {
  pages: {
    business: {
      invites: {
        sectionTitle: 'Invites',
        sectionDescription: 'Manage invites',
        emailLabel: 'Email',
        emailPlaceholder: 'Enter email',
        roleLabel: 'Role',
        rolePlaceholder: 'Select role',
        sendInviteButton: 'Send Invite',
        confirmDialogTitle: 'Confirm Invite',
        confirmDialogDescription: 'Are you sure?',
        confirmSendButton: 'Yes, Send',
        cancelButton: 'Cancel',
        listTitle: 'Pending Invites',
        listDescription: 'View pending invites',
        noInvites: 'No invites found',
        inviteSentSuccess: 'Invite sent!',
        inviteSendError: 'Failed to send invite',
        revokeSuccess: 'Invite revoked!',
        statusLabel: 'Status',
        sentLabel: 'Sent',
        createdLabel: 'Created',
        actionsLabel: 'Actions',
        pendingLabel: 'Pending',
        acceptedLabel: 'Accepted',
        revokedLabel: 'Revoked',
        resendButton: 'Resend',
        revokeButton: 'Revoke',
        yesLabel: 'Yes',
        noLabel: 'No',
        refreshButton: 'Refresh',
        moreActionsLabel: 'More actions',
      },
    },
  },
};

const mockInvites = [
  {
    id: '1',
    invitedEmail: 'test1@test.com',
    businessRole: 'MEMBER',
    status: 'pending',
    emailSent: true,
    createdAt: new Date().toISOString(),
  },
];

describe('BusinessInvites', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BusinessInvites businessId="test-biz" dictionary={mockDictionary} />
      </QueryClientProvider>
    );

  it('renders invites list', async () => {
    (BusinessService.getBusinessInvites as jest.Mock).mockResolvedValue({
      invites: mockInvites,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('test1@test.com')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('submits a new invite after confirmation', async () => {
    (BusinessService.getBusinessInvites as jest.Mock).mockResolvedValue({
      invites: [],
    });
    (BusinessService.inviteBusinessUser as jest.Mock).mockResolvedValue({
      success: true,
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText('Enter email');
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });

    const sendBtn = screen.getByText('Send Invite');
    fireEvent.click(sendBtn);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Invite')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByText('Yes, Send');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(BusinessService.inviteBusinessUser).toHaveBeenCalledWith(
        'test-biz',
        expect.objectContaining({
          invitedEmail: 'new@test.com',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Invite sent!');
    });
  });

  it('revokes an invite', async () => {
    (BusinessService.getBusinessInvites as jest.Mock).mockResolvedValue({
      invites: mockInvites,
    });
    (BusinessService.revokeInvite as jest.Mock).mockResolvedValue({
      success: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('test1@test.com')).toBeInTheDocument();
    });

    // Find the dropdown button (last cell in the row)
    const user = userEvent.setup();
    const moreBtn = screen.getByRole('button', { name: /more actions/i });
    await user.click(moreBtn);

    const revokeBtn = await screen.findByRole('menuitem', { name: /revoke/i });
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(BusinessService.revokeInvite).toHaveBeenCalledWith({
        businessId: 'test-biz',
        inviteId: '1',
      });
      expect(toast.success).toHaveBeenCalledWith('Invite revoked!');
    });
  });
});
