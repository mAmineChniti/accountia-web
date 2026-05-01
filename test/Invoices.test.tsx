import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Invoices from '@/components/app/invoices/Invoices';
import type { Dictionary } from '@/get-dictionary';

// Mock des hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined, isLoading: false, error: undefined }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(),
}));

// On mock le Chatbot pour éviter les erreurs de dictionnaire business.chatbot
vi.mock('@/components/app/business/Chatbot', () => ({
  Chatbot: () => <div data-testid="mock-chatbot" />,
}));

describe('Invoices Component', () => {
  const mockDictionary = {
    pages: {
      invoices: {
        title: 'Mes Factures',
        description: 'Consultez et gérez vos factures',
        totalInvoices: 'Total des factures',
        totalPaid: 'Total payé',
        totalPending: 'Total en attente',
        invoiceList: 'Liste des factures',
        refresh: 'Actualiser',
        createBusinessButton: 'Créer une nouvelle entreprise',
        payment: {
          securePayment: 'Paiement sécurisé',
          completeCardInfo: 'Complétez les informations de votre carte',
          validation: {
            nameRequired: 'Nom du titulaire de la carte requis',
            numberInvalid: 'Numéro de carte invalide',
            expiryInvalid: "Date d'expiration invalide",
            cvcInvalid: 'CVC invalide',
            countryRequired: 'Pays requis',
          },
          countryGroups: {
            northAfrica: 'Afrique du Nord',
          },
        },
        stripeConnect: {
          title: 'Stripe Connect',
          description: 'Connectez votre compte Stripe',
        },
      },
    },
    common: {
      retry: 'Réessayer',
    },
  } as unknown as Dictionary;

  it('should render the title correctly', () => {
    render(<Invoices dictionary={mockDictionary} lang="fr" />);
    expect(screen.getByText('Mes Factures')).toBeDefined();
  });

  it('should render the refresh button', () => {
    render(<Invoices dictionary={mockDictionary} lang="fr" />);
    expect(screen.getByText('Actualiser')).toBeDefined();
  });
});
