/* eslint-disable */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BusinessApplication from './BusinessApplication';
import { BusinessService } from '@/lib/requests';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/lib/requests', () => ({
  BusinessService: {
    applyForBusiness: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockDictionary: any = {
  pages: {
    businessApplication: {
      title: 'Apply for Business',
      description: 'Fill the form',
      businessNameLabel: 'Business Name',
      businessNamePlaceholder: 'Enter business name',
      businessEmailLabel: 'Business Email',
      businessEmailPlaceholder: 'Enter email',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Enter description',
      phoneLabel: 'Phone',
      phonePlaceholder: 'Enter phone',
      websiteLabel: 'Website',
      websitePlaceholder: 'Enter website',
      submitButton: 'Submit',
      submittingButton: 'Submitting...',
      successTitle: 'Success',
      successMessage: 'Application submitted',
      closeButton: 'Close',
      submitError: 'Failed to submit',
    },
  },
};

describe('BusinessApplication', () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BusinessApplication dictionary={mockDictionary} lang="en" />
      </QueryClientProvider>
    );

  it('renders application form', () => {
    renderComponent();
    expect(screen.getByText('Apply for Business')).toBeInTheDocument();
    expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
  });

  it('submits application successfully and shows dialog', async () => {
    (BusinessService.applyForBusiness as jest.Mock).mockResolvedValue({
      success: true,
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Business Name/i), {
      target: { value: 'My Biz' },
    });
    fireEvent.change(screen.getByLabelText(/Business Email/i), {
      target: { value: 'biz@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'A cool business' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '12345678' },
    });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(BusinessService.applyForBusiness).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: 'My Biz',
          businessEmail: 'biz@test.com',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(mockPush).toHaveBeenCalledWith('/en');
  });

  it('shows validation errors for required fields', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Submit'));

    // Validation is handled by react-hook-form and zod,
    // we just check if it doesn't call the service
    await waitFor(() => {
      expect(BusinessService.applyForBusiness).not.toHaveBeenCalled();
    });
  });
});
