import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('next/navigation', () => ({
  useParams: () => ({ lang: 'en' }),
}));

const getMyBusinessesMock = vi.fn();
const getTeamMembersMock = vi.fn();

vi.mock('@/lib/requests', () => ({
  BusinessService: {
    getMyBusinesses: (...args: unknown[]) => getMyBusinessesMock(...args),
    getTeamMembers: (...args: unknown[]) => getTeamMembersMock(...args),
  },
}));

import { BusinessMembers } from './BusinessMembers';

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

const buildMembersResponse = () => ({
  message: 'ok',
  members: [
    {
      id: '1',
      userId: 'u1',
      firstName: 'Alice',
      lastName: 'Owner',
      email: 'alice@example.com',
      role: 'OWNER',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      userId: 'u2',
      firstName: 'Bob',
      lastName: 'Admin',
      email: 'bob@example.com',
      role: 'ADMIN',
      createdAt: '2025-01-02T00:00:00.000Z',
    },
    {
      id: '3',
      userId: 'u3',
      firstName: 'Charlie',
      lastName: 'Member',
      email: 'charlie@example.com',
      role: 'MEMBER',
      createdAt: '2025-01-03T00:00:00.000Z',
    },
    {
      id: '4',
      userId: 'u4',
      firstName: 'Diana',
      lastName: 'Client',
      email: 'diana@example.com',
      role: 'CLIENT',
      createdAt: '2025-01-04T00:00:00.000Z',
    },
  ],
});

describe('BusinessMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTeamMembersMock.mockResolvedValue(buildMembersResponse());
  });

  it('groups members hierarchically under Owner / Admin / Member / Client headings', async () => {
    getMyBusinessesMock.mockResolvedValue({
      businesses: [{ id: 'b1', role: 'OWNER' }],
    });

    renderWithClient(<BusinessMembers businessId="b1" />);

    await waitFor(() => {
      expect(screen.getByText('Owners')).toBeInTheDocument();
    });
    expect(screen.getByText('Admins')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();

    const headings = screen.getAllByRole('row').map((r) => r.textContent ?? '');
    const aliceRow = headings.findIndex((t) => t.includes('Alice'));
    const bobRow = headings.findIndex((t) => t.includes('Bob'));
    const charlieRow = headings.findIndex((t) => t.includes('Charlie'));
    const dianaRow = headings.findIndex((t) => t.includes('Diana'));

    // OWNER < ADMIN < MEMBER < CLIENT in document order
    expect(aliceRow).toBeLessThan(bobRow);
    expect(bobRow).toBeLessThan(charlieRow);
    expect(charlieRow).toBeLessThan(dianaRow);
  });

  it('shows the Invite Member button to OWNER as a link to /invites', async () => {
    getMyBusinessesMock.mockResolvedValue({
      businesses: [{ id: 'b1', role: 'OWNER' }],
    });

    renderWithClient(<BusinessMembers businessId="b1" />);

    const link = await screen.findByRole('link', { name: /invite member/i });
    expect(link).toHaveAttribute('href', '/en/business/b1/invites');
  });

  it('shows the Invite Member button to ADMIN', async () => {
    getMyBusinessesMock.mockResolvedValue({
      businesses: [{ id: 'b1', role: 'ADMIN' }],
    });

    renderWithClient(<BusinessMembers businessId="b1" />);

    expect(
      await screen.findByRole('link', { name: /invite member/i })
    ).toBeInTheDocument();
  });

  it('hides the Invite Member button from MEMBER (read-only view)', async () => {
    getMyBusinessesMock.mockResolvedValue({
      businesses: [{ id: 'b1', role: 'MEMBER' }],
    });

    renderWithClient(<BusinessMembers businessId="b1" />);

    // Wait for the data to render so we know the role check has run.
    await screen.findByText('Owners');
    expect(
      screen.queryByRole('link', { name: /invite member/i })
    ).not.toBeInTheDocument();
  });

  it('renders an empty state when there are no members', async () => {
    getMyBusinessesMock.mockResolvedValue({
      businesses: [{ id: 'b1', role: 'OWNER' }],
    });
    getTeamMembersMock.mockResolvedValue({ message: 'ok', members: [] });

    renderWithClient(<BusinessMembers businessId="b1" />);

    expect(await screen.findByText(/no team members yet/i)).toBeInTheDocument();
  });

  it('shows an error state with retry on fetch failure', async () => {
    getMyBusinessesMock.mockResolvedValue({
      businesses: [{ id: 'b1', role: 'OWNER' }],
    });
    getTeamMembersMock.mockRejectedValue(new Error('boom'));

    renderWithClient(<BusinessMembers businessId="b1" />);

    expect(
      await screen.findByText(/failed to load team members/i)
    ).toBeInTheDocument();
  });

  it('counts members correctly per role badge', async () => {
    getMyBusinessesMock.mockResolvedValue({
      businesses: [{ id: 'b1', role: 'OWNER' }],
    });

    renderWithClient(<BusinessMembers businessId="b1" />);

    const ownersHeading = await screen.findByText('Owners');
    const ownersBadge = within(ownersHeading.parentElement!).getByText('1');
    expect(ownersBadge).toBeInTheDocument();
  });
});
