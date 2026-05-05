/* eslint-disable */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BusinessProducts } from '../app/business-products/BusinessProducts';
import { BusinessService, ProductsService } from '@/lib/requests';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/requests', () => ({
  ProductsService: {
    getProducts: jest.fn(),
    bulkDeleteProducts: jest.fn(),
    deleteProduct: jest.fn(),
    getStockInsights: jest.fn(),
  },
  BusinessService: {
    getBusiness: jest.fn(),
  },
  createAuthenticatedClient: jest.fn(),
  API_CONFIG: {
    PRODUCTS: {
      LIST: 'products',
      CREATE: 'products',
      GET: 'products/{id}',
      UPDATE: 'products/{id}',
      DELETE: 'products/{id}',
      IMPORT: 'products/import',
      STOCK_INSIGHTS: 'products/stock-insights',
      BULK_DELETE: 'products/bulk-delete',
    },
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    line: jest.fn(),
    setDrawColor: jest.fn(),
    save: jest.fn(),
    getNumberOfPages: jest.fn().mockReturnValue(1),
    setPage: jest.fn(),
    getTextWidth: jest.fn().mockReturnValue(0),
  })),
}));

jest.mock('jspdf-autotable', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock dictionary definition
const mockDictionary: any = {
  pages: {
    businessProducts: {
      title: 'Products',
      description: 'Manage products',
      searchPlaceholder: 'Search products...',
      deleteSelected: 'Delete Selected',
      export: 'Export',
      aiReportCSV: 'IA Report (CSV)',
      aiReportPDF: 'IA Report (PDF)',
      columnName: 'Name',
      columnDescription: 'Description',
      columnUnitPrice: 'Unit Price',
      columnCost: 'Cost',
      columnQuantity: 'Quantity',
      noProducts: 'No products found',
      productsDeleted: '{count} products deleted successfully',
      next: 'Next',
      previous: 'Previous',
      page: 'Page {page} of {totalPages}',
      deleteConfirmDescriptionWithName: 'Delete {name}?',
      deleteConfirmTitle: 'Confirm Deletion',
      deleteSuccess: 'Deleted successfully',
      toastDeleteSuccessWithName: 'Deleted {name}',
      bulkDeleteConfirmTitle: 'Bulk Delete',
      bulkDeleteConfirmDescription: 'Delete {count} products?',
      confirmDeleteMultiple: 'Supprimer les produits',
      confirmDelete: 'Supprimer',
      selected: '{count} selected',
      deleteProduct: 'Delete',
    },
    business: {
      chatbot: {
        title: 'Chatbot',
        placeholder: 'Ask something...',
        send: 'Send',
      },
    },
  },
  common: {
    cancel: 'Cancel',
  },
};

// Mock product data
const mockProducts = [
  {
    id: 'p1',
    name: 'Souris Gamer',
    description: 'Souris avec LEDs RGB',
    unitPrice: 45,
    cost: 20,
    quantity: 100,
    businessId: 'test-business',
  },
  {
    id: 'p2',
    name: 'Clavier Logitech',
    description: 'Clavier sans fil USB',
    unitPrice: 89.9,
    cost: 45,
    quantity: 50,
    businessId: 'test-business',
  },
];

describe('BusinessProducts', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
    // Provide default mock for stock insights to avoid query errors
    (ProductsService.getStockInsights as jest.Mock).mockResolvedValue({
      businessId: 'test-business',
      generatedAt: new Date().toISOString(),
      lookbackDays: 30,
      planningHorizonDays: 30,
      summary: {
        totalProducts: 2,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 2,
        totalRecommendedUnits: 0,
      },
      items: [],
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BusinessProducts
          businessId="test-business"
          dictionary={mockDictionary}
          lang="fr"
        />
      </QueryClientProvider>
    );

  it('1. should select a single product and show bulk delete button', async () => {
    (ProductsService.getProducts as jest.Mock).mockResolvedValue({
      products: mockProducts,
      total: 2,
    });

    renderComponent();

    // Wait for the products to load
    await waitFor(() => {
      expect(screen.getByText('Souris Gamer')).toBeInTheDocument();
    });

    // Bulk delete button should NOT be visible initially
    expect(screen.queryByText(/delete selected/i)).not.toBeInTheDocument();

    // Find the checkboxes (the first one is "Select All" in the header, others in rows)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3); // 1 header + 2 rows

    // Select the first product (second checkbox)
    const user = userEvent.setup();
    await user.click(checkboxes[1]);

    // Now the bulk delete button and selection count should appear
    expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete selected/i })
    ).toBeInTheDocument();
  });

  it('2. should "Select All" products and update count', async () => {
    (ProductsService.getProducts as jest.Mock).mockResolvedValue({
      products: mockProducts,
      total: 2,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Clavier Logitech')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    // Select all checkbox is the first one
    const selectAllCheckbox = checkboxes[0];

    fireEvent.click(selectAllCheckbox);

    // Bulk delete button should show (2) selected items
    expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete selected/i })
    ).toBeInTheDocument();
  });

  it('3. should bulk delete selected products successfully', async () => {
    (ProductsService.getProducts as jest.Mock).mockResolvedValue({
      products: mockProducts,
      total: 2,
    });
    (ProductsService.bulkDeleteProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: { deleted: 1, notFound: [] },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Souris Gamer')).toBeInTheDocument();
    });

    // Select the first product
    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);

    // Click delete selected
    const deleteBtn = screen.getByRole('button', { name: /delete selected/i });
    await user.click(deleteBtn);

    // Click confirm in dialog
    const confirmBtn = await screen.findByRole('button', {
      name: /supprimer/i,
    });
    await user.click(confirmBtn);

    // Expect delete mutation to have been called with the correct id
    await waitFor(() => {
      expect(ProductsService.bulkDeleteProducts).toHaveBeenCalledWith(
        'test-business',
        { ids: ['p1'] }
      );
    });

    // Expect success toast
    expect(toast.success).toHaveBeenCalledWith(
      '1 products deleted successfully'
    );
  });

  it('4. should filter products when searching', async () => {
    (ProductsService.getProducts as jest.Mock).mockResolvedValue({
      products: mockProducts,
      total: 2,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Souris Gamer')).toBeInTheDocument();
      expect(screen.getByText('Clavier Logitech')).toBeInTheDocument();
    });

    // Search for "Clavier"
    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'Clavier' } });

    // Souris Gamer should disappear because it's filtered client-side or refetched
    await waitFor(() => {
      expect(screen.queryByText('Souris Gamer')).not.toBeInTheDocument();
      expect(screen.getByText('Clavier Logitech')).toBeInTheDocument();
    });
  });

  it('5. should delete a single product from the dropdown menu', async () => {
    (ProductsService.getProducts as jest.Mock).mockResolvedValue({
      products: mockProducts,
      total: 2,
    });
    (ProductsService.deleteProduct as jest.Mock).mockResolvedValue(true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Souris Gamer')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Find the more options button for the first product
    const moreOptionsBtns = screen.getAllByRole('button', {
      name: /more actions for/i,
    });
    await user.click(moreOptionsBtns[0]);

    // Wait for dropdown to open and click Delete
    const deleteMenuBtn = await screen.findByRole('menuitem', {
      name: /delete/i,
    });
    await user.click(deleteMenuBtn);

    // Provide the confirmDelete text since it's mapped to t.confirmDelete or 'Supprimer' fallback
    const confirmBtn = await screen.findByText(/supprimer/i);
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(ProductsService.deleteProduct).toHaveBeenCalledWith(
        'p1',
        'test-business'
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Deleted successfully');
  });
});
