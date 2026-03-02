'use client';
import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

import { Separator } from '@/components/ui/separator';

export type Channel = 'inApp' | 'email' | 'sms';

type Pref = {
  event: string;
  label: string;
  channels: Record<Channel, boolean>;
};
type InboxItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  type: 'security' | 'system' | 'billing' | 'product';
  read: boolean;
};
type ActivityItem = {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'success';
};

const INITIAL_PREFS: Pref[] = [
  {
    event: 'new_login',
    label: 'New login detected',
    channels: { inApp: true, email: true, sms: false },
  },
  {
    event: 'password_changed',
    label: 'Password changed',
    channels: { inApp: true, email: true, sms: true },
  },
  {
    event: 'newsletter',
    label: 'Product newsletter',
    channels: { inApp: false, email: true, sms: false },
  },
  {
    event: 'billing_updates',
    label: 'Billing and invoices',
    channels: { inApp: true, email: true, sms: false },
  },
];

const INITIAL_INBOX: InboxItem[] = Array.from({ length: 19 }).map((_, idx) => ({
  id: `notif-${idx + 1}`,
  title:
    idx % 3 === 0
      ? 'Security alert'
      : idx % 3 === 1
        ? 'System update'
        : 'Billing receipt',
  body: `Notification message #${idx + 1}`,
  createdAt: new Date(Date.now() - idx * 3_600_000 * 5).toISOString(),
  type: idx % 3 === 0 ? 'security' : idx % 3 === 1 ? 'system' : 'billing',
  read: idx % 2 === 0,
}));

const INITIAL_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    action: 'Logged in',
    details: 'Signed in from Chrome on macOS',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    severity: 'success',
  },
  {
    id: 'a2',
    action: 'Updated profile',
    details: 'Changed phone number',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    severity: 'info',
  },
  {
    id: 'a3',
    action: '2FA enabled',
    details: 'Authenticator app configured',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    severity: 'success',
  },
  {
    id: 'a4',
    action: 'Failed login attempt',
    details: 'Unsuccessful login from unknown IP',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    severity: 'warning',
  },
];

export function NotificationPreferencesCenter() {
  const [prefs, setPrefs] = useState(INITIAL_PREFS);
  const toggle = (event: string, channel: Channel) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.event === event
          ? {
              ...p,
              channels: { ...p.channels, [channel]: !p.channels[channel] },
            }
          : p
      )
    );
  };

  return (
    <Card className="dark:bg-card/90 rounded-xl border-0 bg-white/90 shadow">
      <CardHeader>
        <CardTitle>Notification Preferences Center</CardTitle>
        <CardDescription>
          Control which events notify you on each channel.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 pt-6">
        {prefs.map((pref) => (
          <div
            key={pref.event}
            className="grid grid-cols-1 items-center gap-3 rounded-lg border p-3 md:grid-cols-4"
          >
            <div className="font-medium md:col-span-1">{pref.label}</div>
            {(['inApp', 'email', 'sms'] as Channel[]).map((ch) => (
              <div key={ch} className="flex items-center gap-2">
                <Checkbox
                  checked={pref.channels[ch]}
                  onCheckedChange={() => toggle(pref.event, ch)}
                  id={`${pref.event}-${ch}`}
                />
                <label
                  htmlFor={`${pref.event}-${ch}`}
                  className="text-sm capitalize"
                >
                  {ch === 'inApp' ? 'In-app' : ch}
                </label>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function NotificationInbox() {
  const [items, setItems] = useState(INITIAL_INBOX);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [type, setType] = useState<'all' | InboxItem['type']>('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(
    () =>
      items.filter((n) => {
        const matchesQuery =
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.body.toLowerCase().includes(query.toLowerCase());
        const matchesStatus =
          status === 'all' || (status === 'read' ? n.read : !n.read);
        const matchesType = type === 'all' || n.type === type;
        return matchesQuery && matchesStatus && matchesType;
      }),
    [items, query, status, type]
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const toggleRead = (id: string) =>
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );

  return (
    <Card className="dark:bg-card/90 rounded-xl border-0 bg-white/90 shadow">
      <CardHeader>
        <CardTitle>In-app Notification Inbox</CardTitle>
        <CardDescription>
          Read/unread management with filtering and pagination.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search notifications..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="bg-background h-10 rounded-md border px-3"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as 'all' | 'read' | 'unread');
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
          <select
            className="bg-background h-10 rounded-md border px-3"
            value={type}
            onChange={(e) => {
              setType(e.target.value as 'all' | InboxItem['type']);
              setPage(1);
            }}
          >
            <option value="all">All types</option>
            <option value="security">Security</option>
            <option value="system">System</option>
            <option value="billing">Billing</option>
            <option value="product">Product</option>
          </select>
        </div>
        <div className="space-y-2">
          {paginated.map((n) => (
            <div key={n.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between">
                <div className="font-medium">{n.title}</div>
                <Badge variant={n.read ? 'secondary' : 'default'}>
                  {n.read ? 'Read' : 'Unread'}
                </Badge>
              </div>
              <div className="text-muted-foreground text-sm">{n.body}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleRead(n.id)}
                >
                  {n.read ? 'Mark unread' : 'Mark read'}
                </Button>
              </div>
            </div>
          ))}
          {paginated.length === 0 && (
            <div className="text-muted-foreground text-sm">
              No notifications found.
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserActivityTimeline() {
  return (
    <Card className="dark:bg-card/90 rounded-xl border-0 bg-white/90 shadow">
      <CardHeader>
        <CardTitle>User Activity Timeline</CardTitle>
        <CardDescription>
          Self audit log of your account events.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="space-y-4">
          {INITIAL_ACTIVITY.map((item) => (
            <div key={item.id} className="relative border-l pl-4">
              <span className="bg-primary absolute top-1 -left-[5px] h-2.5 w-2.5 rounded-full" />
              <div className="flex items-center justify-between">
                <p className="font-medium">{item.action}</p>
                <Badge
                  variant={
                    item.severity === 'warning' ? 'destructive' : 'secondary'
                  }
                >
                  {item.severity}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">{item.details}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
