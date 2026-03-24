'use server';

import type { PaginatedAuditLogs } from '@/types/audit';
import { getToken } from '@/actions/cookies';

export async function fetchAuditLogs(
  page = 1,
  limit = 20,
  action?: string
): Promise<PaginatedAuditLogs> {
  const tokenData = await getToken();
  const token = tokenData?.token;

  if (!token) {
    throw new Error('Unauthorized: No access token found.');
  }

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(action ? { action } : {}),
  });

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/audit?${queryParams}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error('Failed to fetch audit logs:', await response.text());
    throw new Error('Failed to fetch audit logs');
  }

  return response.json();
}
