'use server';

import { getToken } from '@/actions/cookies';

export interface AdminNotification {
  id: string;
  type: string;
  message: string;
  payload: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AdminNotification[];
  unreadCount: number;
}

export async function fetchNotifications(): Promise<NotificationsResponse> {
  const tokenData = await getToken();
  const token = tokenData?.token;

  if (!token) {
    throw new Error('Unauthorized: No access token found.');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/notifications`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  const tokenData = await getToken();
  const token = tokenData?.token;

  if (!token) return;

  await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  const tokenData = await getToken();
  const token = tokenData?.token;

  if (!token) return;

  await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
