import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BusinessStatistics from './BusinessStatistics';
import { BusinessService, ProductsService } from '@/lib/requests';

// Mock dependencies
jest.mock('@/lib/requests', () => ({
  BusinessService: {
    getBusinessStatistics: jest.fn(),
  },
  ProductsService: {
    getStockInsights: jest.fn(),
  },
}));

// Mock Recharts to avoid JSDOM issues
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ children }: any) => (
    <svg data-testid="composed-chart">{children}</svg>
  ),
  CartesianGrid: () => <g />,
  XAxis: () => <g />,
  YAxis: () => <g />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Area: () => <path />,
  Line: () => <path />,
  Bar: () => <rect />,
}));

// Mock Lucide icons - use span to avoid <div> inside <p> hydration errors
jest.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="alert-circle" />,
  TrendingUp: () => <span data-testid="trending-up" />,
  TrendingDown: () => <span data-testid="trending-down" />,
  Minus: () => <span data-testid="minus" />,
  Package: () => <span data-testid="package" />,
  Receipt: () => <span data-testid="receipt" />,
  DollarSign: () => <span data-testid="dollar-sign" />,
  Percent: () => <span data-testid="percent" />,
  Loader2: () => <span data-testid="loader" />,
}));

// Mock SVG sub-elements that React warns about when not in an SVG context or when JSDOM chokes
const originalCreateElement = React.createElement;
jest
  .spyOn(React, 'createElement')
  .mockImplementation((type, props, ...children) => {
    if (type === 'defs' || type === 'linearGradient' || type === 'stop') {
      return originalCreateElement('g', props, ...children);
    }
    return originalCreateElement(type, props, ...children);
  });

// Mock components
jest.mock('@/components/app/business/Chatbot', () => ({
  Chatbot: () => <div data-testid="chatbot" />,
}));

const mockDictionary: any = {
  pages: {
    business: {
      statisticsUi: {
        totalRevenue: 'Total Revenue',
        totalCOGS: 'Total COGS',
        grossProfit: 'Gross Profit',
        netProfit: 'Net Profit',
        profitMargin: 'Profit Margin',
        revenueForecast: 'Revenue Forecast',
        businessTrend: 'Business Trend',
        historicalData: 'Historical',
        predictedData: 'Predicted',
        fetchError: 'Failed to fetch statistics',
        noStatistics: 'No statistics available',
        noData: 'No data to display',
        period: 'Period',
        costOfGoodsSold: 'Cost of Goods Sold',
        revenueMinusCOGS: 'Revenue minus COGS',
        afterAllExpenses: 'After all expenses',
        grossProfitMargin: 'Gross profit margin',
        historicalVsAIPredicted: 'Historical vs AI Predicted',
        overallPerformanceDirection: 'Overall performance direction',
        profitabilityAnalysis: 'Profitability Analysis',
        revenueCOGSAndProfit: 'Revenue, COGS and Profit',
        salesVolumeForecast: 'Sales Volume Forecast',
        unitsSoldHistoricalVsPredicted: 'Units sold historical vs predicted',
        units: 'units',
        invoiceStatus: 'Invoice Status',
        paymentCollectionOverview: 'Payment collection overview',
        growth: 'Growth',
        decline: 'Decline',
        stagnation: 'Stagnation',
        basedOnSalesVolume: 'Based on sales volume',
      },
    },
  },
};

const mockStatsData = {
  kpis: {
    totalRevenue: 10000,
    totalCOGS: 6000,
    grossProfit: 4000,
    netProfit: 4000,
    profitMarginPercent: 40,
  },
  invoiceStatistics: {
    totalInvoices: 10,
    paidInvoices: 5,
    pendingInvoices: 3,
    overdueInvoices: 2,
    paidAmount: 5000,
    pendingAmount: 3000,
    overdueAmount: 2000,
  },
  productStatistics: {
    totalProducts: 5,
    totalInventoryValue: 20000,
    lowStockProducts: 1,
  },
  salesAnalytics: {
    salesTrend: 'growth',
    topProducts: [],
  },
  revenueTimeSeries: {
    revenue: { historical: [], predicted: [] },
    cogs: { historical: [], predicted: [] },
    salesVolume: { historical: [], predicted: [] },
  },
  period: { start: '2024-01', end: '2024-03' },
};

describe('BusinessStatistics', () => {
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
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BusinessStatistics
          businessId="test-biz"
          dictionary={mockDictionary}
          lang="en"
        />
      </QueryClientProvider>
    );

  it('renders loading state initially', () => {
    (BusinessService.getBusinessStatistics as jest.Mock).mockReturnValue(
      new Promise(() => {})
    );
    (ProductsService.getStockInsights as jest.Mock).mockReturnValue(
      new Promise(() => {})
    );
    renderComponent();
    expect(
      screen
        .getAllByRole('generic')
        .some((el) => el.className.includes('skeleton'))
    ).toBeDefined();
  });

  it('renders error state when fetch fails', async () => {
    (BusinessService.getBusinessStatistics as jest.Mock).mockRejectedValue(
      new Error('Fetch failed')
    );
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch statistics')
      ).toBeInTheDocument();
    });
  });

  it('renders statistics correctly when data is loaded', async () => {
    (BusinessService.getBusinessStatistics as jest.Mock).mockResolvedValue(
      mockStatsData
    );
    (ProductsService.getStockInsights as jest.Mock).mockResolvedValue({
      items: [],
      summary: {
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        totalValueAtRisk: 0,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getAllByText(/10,000/)[0]).toBeInTheDocument();
      expect(screen.getByText(/40/)).toBeInTheDocument();
      expect(screen.getByText('Growth')).toBeInTheDocument();
    });
  });

  it('renders empty state when no data is available', async () => {
    (BusinessService.getBusinessStatistics as jest.Mock).mockResolvedValue({
      ...mockStatsData,
      productStatistics: {
        totalProducts: 0,
        totalInventoryValue: 0,
        lowStockProducts: 0,
      },
      invoiceStatistics: {
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
      },
    });
    (ProductsService.getStockInsights as jest.Mock).mockResolvedValue({
      items: [],
      summary: {
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        totalValueAtRisk: 0,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No data to display')).toBeInTheDocument();
    });
  });
});
