'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { getList, postAction, qs } from '@/lib/api';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import type { AdminNotification } from '@/lib/types';

/**
 * Where a notification points. Payments have a detail page keyed by the payment
 * id (`related_id`); everything else routes to the originating organization,
 * since there is no subscription detail page. Returns null when there's nowhere
 * meaningful to go (e.g. a notification with no organization).
 */
function notificationHref(n: AdminNotification): string | null {
  if (n.type === 'PAYMENT_SUBMITTED' && n.related_id) {
    return `/payments/${n.related_id}`;
  }
  if (n.organization_id) {
    return `/organizations/${n.organization_id}`;
  }
  return null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      getList<AdminNotification>('notifications' + qs({ limit: 12 })),
    refetchInterval: 30_000,
  });

  const items = data?.data ?? [];
  const unread =
    (data?.meta as { unread_count?: number } | undefined)?.unread_count ?? 0;

  const markRead = useMutation({
    mutationFn: (id: string) => postAction(`notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: () => postAction('notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex size-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-brand-primary/8 hover:text-brand-primary"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-brand-black">
                Notifications
              </span>
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="flex items-center gap-1 text-xs text-brand-secondary hover:text-brand-primary"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-400">
                  You&apos;re all caught up.
                </div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markRead.mutate(n.id);
                      const href = notificationHref(n);
                      setOpen(false);
                      if (href) router.push(href);
                    }}
                    className={cn(
                      'flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                      !n.is_read && 'bg-brand-primary/5',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        n.is_read ? 'bg-transparent' : 'bg-brand-primary',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-brand-black">
                        {n.title}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {n.body}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-400">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
