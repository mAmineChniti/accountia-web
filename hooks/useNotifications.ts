import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { getToken } from '@/actions/cookies';
import { NotificationsService } from '@/lib/requests';
import { env } from '@/env';
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
  const socketRef = useRef<Socket | undefined>(undefined);
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);

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

  // Listen for logout event and disconnect socket
  useEffect(() => {
    const handleAuthChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ action?: string }>;
      const action = customEvent.detail?.action;

      // Only disconnect socket on logout
      if (action === 'logout') {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = undefined;
        }
        setIsConnected(false);
        isInitializingRef.current = false;
      }
    };

    // Listen for auth state changes
    globalThis.addEventListener('auth:changed', handleAuthChanged);

    return () => {
      globalThis.removeEventListener('auth:changed', handleAuthChanged);
    };
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!enabled) return;

    // Reset the mounted flag for this effect cycle
    isMountedRef.current = true;

    const initSocket = async () => {
      // Prevent duplicate initialization
      if (isInitializingRef.current || socketRef.current) {
        return;
      }

      isInitializingRef.current = true;

      try {
        const token = await getToken();
        if (!token || !isMountedRef.current) {
          return;
        }

        // Get the backend URL from environment and derive socket URL safely
        const backendUrl = env.NEXT_PUBLIC_BACKEND ?? 'http://127.0.0.1:4789';

        let socketUrl: string;
        try {
          // Parse the backend URL to extract base URL
          const url = new URL(backendUrl);
          // Use the origin (protocol + host) as the socket URL
          socketUrl = url.origin;

          // If the pathname has segments beyond just /api, preserve relevant path parts
          if (
            url.pathname &&
            url.pathname !== '/' &&
            !url.pathname.endsWith('/api')
          ) {
            // Remove trailing /api and any query/hash
            let pathname = url.pathname;
            if (pathname.endsWith('/')) {
              pathname = pathname.slice(0, -1);
            }
            if (pathname.endsWith('/api')) {
              pathname = pathname.slice(0, -4);
            }
            if (pathname && pathname !== '/') {
              socketUrl += pathname;
            }
          }
        } catch {
          // If URL parsing fails, fall back to naive string replacement
          socketUrl = backendUrl.endsWith('/api')
            ? backendUrl.slice(0, -4)
            : backendUrl;
          // Handle trailing slash
          if (socketUrl.endsWith('/')) {
            socketUrl = socketUrl.slice(0, -1);
          }
        }

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
          reconnectionAttempts: 10,
          // Explicitly set transports - try WebSocket first, fall back to polling
          transports: ['websocket', 'polling'],
          // Add these options for better compatibility
          upgrade: true,
          rememberUpgrade: false,
          forceNew: false,
        });

        // Only set ref if component is still mounted
        if (!isMountedRef.current) {
          newSocket.disconnect();
          return;
        }

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          if (isMountedRef.current) {
            setIsConnected(true);
          }
        });

        newSocket.on('disconnect', (_reason: string) => {
          if (isMountedRef.current) {
            setIsConnected(false);
          }
        });

        newSocket.on('notification', (notification: Notification) => {
          if (!isMountedRef.current) return;

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

        newSocket.on('connect_error', (error: Error | unknown) => {
          console.warn('Socket connection error:', error);
          // Connection errors are normal during reconnection attempts
          // The client will keep trying to reconnect
        });

        newSocket.on('error', (error: Error | unknown) => {
          console.error('Socket error:', error);
        });
      } catch (error_) {
        console.error('Failed to initialize notifications socket:', error_);
        if (isMountedRef.current) {
          setIsConnected(false);
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    initSocket();

    return () => {
      isMountedRef.current = false;
      isInitializingRef.current = false;

      // Always disconnect the socket, regardless of its state
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = undefined;
      }
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
