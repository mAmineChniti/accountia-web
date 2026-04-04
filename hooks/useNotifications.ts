import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { getToken } from '@/actions/cookies';
import { NotificationsService } from '@/lib/requests';
import type { Notification } from '@/types/ResponseInterfaces';

export interface UseNotificationsOptions {
  businessId?: string;
  enabled?: boolean;
}

export function useNotifications({
  businessId,
  enabled = true,
}: UseNotificationsOptions) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const shownToastIdsRef = useRef<Set<string>>(new Set());

  // Fetch notifications
  const {
    data: notificationsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', businessId],
    queryFn: () => NotificationsService.getNotifications(businessId),
    enabled,
    refetchInterval: 30_000, // Refetch every 30 seconds as fallback
  });

  const notifications = notificationsResponse?.notifications ?? [];
  const unreadCount = notificationsResponse?.unreadCount ?? 0;

  // Mark notification as read
  const { mutate: markAsReadMutate, isPending: isMarkAsReadPending } =
    useMutation({
      mutationFn: (notificationId: string) =>
        NotificationsService.markAsRead(notificationId),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['notifications', businessId],
        });
      },
    });

  // Mark all as read
  const { mutate: markAllAsReadMutate, isPending: isMarkAllAsReadPending } =
    useMutation({
      mutationFn: () => NotificationsService.markAllAsRead(businessId),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['notifications', businessId],
        });
      },
    });

  // Initialize WebSocket connection
  useEffect(() => {
    if (!enabled) return;

    const initSocket = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const socketUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const query: Record<string, string> = { token: token.token };
        if (businessId) {
          query.businessId = businessId;
        }

        const newSocket = io(socketUrl, {
          query,
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          setIsConnected(false);
        });

        newSocket.on('notification', (notification: Notification) => {
          // Invalidate queries to refetch notifications
          queryClient.invalidateQueries({
            queryKey: ['notifications', businessId],
          });

          // Show toast for new real-time notifications
          if (!shownToastIdsRef.current.has(notification.id)) {
            shownToastIdsRef.current.add(notification.id);

            toast(notification.message, {
              description: notification.type,
              action: {
                label: 'Mark as read',
                onClick: () => {
                  markAsReadMutate(notification.id);
                },
              },
            });
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
        });

        return () => {
          newSocket.disconnect();
        };
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    const cleanup = initSocket();
    return () => {
      cleanup?.then((fn) => fn?.());
    };
  }, [enabled, businessId, queryClient, markAsReadMutate]);

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutate(notificationId);
    },
    [markAsReadMutate]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutate();
  }, [markAllAsReadMutate]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    isConnected,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    isMarkingAsRead: isMarkAsReadPending,
    isMarkingAllAsRead: isMarkAllAsReadPending,
  };
}
