'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Check, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { type Locale } from '@/i18n-config';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type Dictionary } from '@/get-dictionary';

// Get notification icon based on type
function getNotificationIcon(type: string) {
  switch (type) {
    case 'invoice.sent':
    case 'invoice.paid':
    case 'invoice.viewed':
    case 'invoice.overdue': {
      return '📄';
    }
    case 'business.approved':
    case 'business.rejected': {
      return '🏢';
    }
    default: {
      return '📢';
    }
  }
}

export function Notifications({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const t = dictionary.pages.notifications;

  // Extract businessId from pathname if we're on a business route
  const businessIdMatch = pathname.match(/\/business\/([^/]+)/);
  const businessId = businessIdMatch?.[1];

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead,
  } = useNotifications({
    businessId,
    enabled: true,
  });

  // Format relative time
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t.justNow;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t.minutesAgo.replace('{count}', String(minutes));
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t.hoursAgo.replace('{count}', String(hours));
    const days = Math.floor(hours / 24);
    if (days < 7) return t.daysAgo.replace('{count}', String(days));
    return date.toLocaleDateString(lang);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent side="bottom" align="end" className="w-96 p-0 shadow-lg">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{t.title}</h2>
              {unreadCount > 0 && (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-xs"
                onClick={() => markAllAsRead()}
                disabled={isMarkingAllAsRead}
              >
                {isMarkingAllAsRead ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                <span className="ml-1">{t.markAllAsRead}</span>
              </Button>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2">
              <Bell className="text-muted-foreground h-8 w-8" />
              <p className="text-sm font-medium">{t.noNotifications}</p>
              <p className="text-muted-foreground text-xs">{t.allCaughtUp}</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="flex flex-col">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <button
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                      disabled={isMarkingAsRead}
                      className={`hover:bg-accent w-full px-4 py-3 text-left transition-colors ${
                        notification.isRead
                          ? ''
                          : 'bg-blue-50 dark:bg-blue-950/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="mt-1 shrink-0 text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm ${
                              notification.isRead
                                ? 'text-muted-foreground'
                                : 'text-foreground font-medium'
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {getRelativeTime(notification.createdAt)}
                          </p>
                        </div>

                        {/* Read indicator */}
                        {!notification.isRead && (
                          <div className="mt-1 shrink-0">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          </div>
                        )}
                      </div>
                    </button>

                    {index < notifications.length - 1 && (
                      <Separator className="m-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
