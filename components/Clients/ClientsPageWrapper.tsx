/* eslint-disable unicorn/no-null */
'use client';

import { useEffect, useState } from 'react';
import { BusinessService } from '@/lib/requests';
import ClientManagement from '@/components/Clients/ClientManagement';

export default function ClientsPageWrapper() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const data = await BusinessService.getMyBusinesses();
        // getMyBusinesses returns { businesses: [...] }
        const businesses =
          data?.businesses ?? (Array.isArray(data) ? data : []);
        const business = businesses[0];
        if (business?.id) {
          setBusinessId(business.id);
        } else {
          setError('No business found. Please create a business first.');
        }
      } catch {
        setError('Failed to load business information.');
      } finally {
        setLoading(false);
      }
    }
    fetchBusiness();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (error || !businessId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-center">
          {error ?? 'Unable to find your business.'}
        </p>
      </div>
    );
  }

  return <ClientManagement businessId={businessId} />;
}
