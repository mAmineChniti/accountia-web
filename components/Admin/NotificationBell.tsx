'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AdminNotification,
} from '@/actions/notifications';

const TYPE_ICON: Record<string, string> = {
  NEW_BUSINESS_APPLICATION: '📋',
  BUSINESS_APPROVED: '✅',
  BUSINESS_REJECTED: '❌',
  USER_BANNED: '🚫',
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // SSE: listen for real-time notifications
  useEffect(() => {
    let es: EventSource | null = null;

    const connectSSE = () => {
      // Get token from cookie for SSE (we need to put it as query param for EventSource)
      fetch('/api/sse-token')
        .then((r) => r.json())
        .then(({ token }) => {
          if (!token) return;
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND;
          es = new EventSource(`${backendUrl}/notifications/sse?token=${token}`);

          es.onmessage = (event) => {
            try {
              const newNotif = JSON.parse(event.data) as AdminNotification;
              setNotifications((prev) => [
                { ...newNotif, isRead: false },
                ...prev,
              ]);
              setUnreadCount((c) => c + 1);
            } catch {
              // ignore parse errors
            }
          };

          es.onerror = () => {
            es?.close();
            // Retry after 5s
            setTimeout(connectSSE, 5000);
          };
        })
        .catch(() => {
          // Retry after 5s if token fetch fails
          setTimeout(connectSSE, 5000);
        });
    };

    connectSSE();

    return () => {
      es?.close();
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition-colors ${
                    !n.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-xl">
                    {TYPE_ICON[n.type] ?? '🔔'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {n.payload?.applicationId && (
                        <Link
                          href="/en/dashboard/businesses"
                          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                          onClick={() => {
                            if (!n.isRead) handleMarkRead(n.id);
                            setOpen(false);
                          }}
                        >
                          View →
                        </Link>
                      )}
                      {!n.isRead && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleMarkRead(n.id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">
              Showing last {notifications.length} notifications
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
