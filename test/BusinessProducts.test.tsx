import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BusinessProducts } from '@/components/app/business-products/BusinessProducts';
import type { Dictionary } from '@/get-dictionary';

// Mock de react-query
vi.mock('@tanstack/react-query', () => {
  const mockUniversalData = {
    data: [],
    meta: { total: 0, page: 1, totalPages: 1 },
    summary: {
      totalProducts: 10,
      highRiskCount: 1,
      mediumRiskCount: 1,
    },
    // On ajoute 'items' pour que prioritizedInsights ne soit pas vide
    items: [{ riskLevel: 'HIGH', estimatedDaysUntilStockout: 5 }],
    criticalReorders: [],
    thisWeekQueue: [],
    healthyProducts: 8,
    riskExposure: 20,
  };

  return {
    useQuery: vi.fn().mockReturnValue({
      data: mockUniversalData,
      isLoading: false,
      error: undefined,
    }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock('@/lib/requests', () => ({
  ProductsService: {
    getProducts: vi.fn(),
    getStockInsights: vi.fn(),
  },
}));

// Mock des Tabs pour tout afficher
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-tabs">{children}</div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TabsTrigger: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  TabsContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-tabs-content">{children}</div>
  ),
}));

vi.mock('@/components/app/business/Chatbot', () => ({
  Chatbot: () => <div data-testid="mock-chatbot" />,
}));

describe('BusinessProducts Component (AI Insights)', () => {
  const mockDictionary = {
    pages: {
      businessProducts: {
        title: 'Produits',
        description: 'Gérer les produits de cette entreprise',
        tabs: {
          list: 'Liste',
          insights: 'Aperçus IA',
        },
        stockInsights: {
          title: 'Aperçus du stock IA',
          description: 'Tableau opérationnel IA local',
          lastUpdated: 'Mis à jour : {date}',
          criticalReorders: 'Réapprovisionnements critiques',
          immediateAction: 'Action immédiate',
          riskExposure: 'Exposition au risque',
          thisWeekQueue: "File d'attente de cette semaine",
          planPurchasing: "Planifier le cycle d'achat",
          healthyProducts: 'Produits sains',
          noUrgentReorder: 'Pas de réapprovisionnement urgent',
        },
        bulkDeleteConfirmTitle: 'Supprimer les produits sélectionnés',
        bulkDeleteConfirmDescription: 'Supprimer {count} produits ?',
        deleteConfirmTitle: 'Supprimer le produit',
        deleteConfirmDescriptionWithName: 'Supprimer {name} ?',
      },
    },
    common: {
      retry: 'Réessayer',
      cancel: 'Annuler',
    },
  } as unknown as Dictionary;

  it('should render the AI Insights tab trigger', () => {
    render(
      <BusinessProducts
        businessId="123"
        lang="fr"
        dictionary={mockDictionary}
      />
    );
    expect(screen.getByText(/aperçus ia/i)).toBeDefined();
  });

  it('should render the Insights title', () => {
    render(
      <BusinessProducts
        businessId="123"
        lang="fr"
        dictionary={mockDictionary}
      />
    );
    expect(screen.getByText(/aperçus du stock ia/i)).toBeDefined();
  });

  it('should display the risk exposure card label', () => {
    render(
      <BusinessProducts
        businessId="123"
        lang="fr"
        dictionary={mockDictionary}
      />
    );
    expect(screen.getByText(/exposition au risque/i)).toBeDefined();
  });
});
