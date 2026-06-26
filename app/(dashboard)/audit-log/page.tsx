'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ReceiptText,
  ScrollText,
  Search,
  User,
} from 'lucide-react';
import { getList, qs } from '@/lib/api';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import type { AuditLogEntry } from '@/lib/types';
import { Spinner } from '@/components/ui';
import { Topbar } from '@/components/Topbar';
import { AvatarBadge } from '@/components/dashboard/AvatarBadge';

const CATEGORIES: { label: string; value: string; icon: LucideIcon }[] = [
  { label: 'All', value: '', icon: ScrollText },
  { label: 'Payment', value: 'payment.', icon: ReceiptText },
  { label: 'Subscription', value: 'subscription.', icon: CreditCard },
  { label: 'Organization', value: 'organization.', icon: Building2 },
  { label: 'User', value: 'user.', icon: User },
];

const CATEGORY_ICON: Record<string, LucideIcon> = {
  payment: ReceiptText,
  subscription: CreditCard,
  organization: Building2,
  user: User,
};

const DESTRUCTIVE = new Set(['suspend', 'cancel', 'reject', 'deactivate']);
const POSITIVE = new Set(['verify', 'reactivate', 'extend', 'activate']);

const COLS = 'grid-cols-[1fr_1.8fr_1.5fr_1.4fr_auto]';

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function titleCase(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** `payment.verify` → { category: 'payment', verb: 'verify', tone }. */
function parseAction(action: string) {
  const [category, ...rest] = action.split('.');
  const verb = rest.join('.');
  const tone = DESTRUCTIVE.has(verb)
    ? 'bg-red-50 text-red-700'
    : POSITIVE.has(verb)
      ? 'bg-brand-primary/10 text-brand-primary'
      : 'bg-gray-100 text-brand-black';
  return {
    category,
    label: rest.length ? `${titleCase(category)} · ${titleCase(verb)}` : titleCase(action),
    tone,
    icon: CATEGORY_ICON[category] ?? ScrollText,
  };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

function diffEntries(before: unknown, after: unknown) {
  const b = isPlainObject(before) ? before : {};
  const a = isPlainObject(after) ? after : {};
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])];
  return keys.map((key) => ({
    key,
    before: b[key],
    after: a[key],
    changed: JSON.stringify(b[key]) !== JSON.stringify(a[key]),
  }));
}

export default function AuditLogPage() {
  const [category, setCategory] = useState('');
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 25;

  const effective = text.trim() || category;

  // Reset to the first page whenever filters change (adjust-state-on-render).
  const filterKey = `${category}|${text}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', category, text, page],
    queryFn: () =>
      getList<AuditLogEntry>(
        'audit-log' + qs({ search: effective, page, limit }),
      ),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Topbar
        title="Audit log"
        subtitle={`${total} ${total === 1 ? 'action' : 'actions'} recorded · every platform-admin write, in order`}
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.value && !text.trim();
            return (
              <button
                key={c.value}
                onClick={() => {
                  setText('');
                  setCategory(c.value);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-primary text-white'
                    : 'bg-white text-brand-black/70 ring-1 ring-gray-200 hover:bg-gray-50',
                )}
              >
                <Icon className="size-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search action, target…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-brand-black outline-none transition-colors placeholder:text-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 sm:w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* Horizontally scrollable on small screens; natural fit at lg+ */}
        <div className="overflow-x-auto">
          <div className="min-w-[760px] lg:min-w-0">
            <div
              className={cn(
                'grid gap-3 border-b border-gray-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400',
                COLS,
              )}
            >
              <span>When</span>
              <span>Admin</span>
              <span>Action</span>
              <span>Target</span>
              <span />
            </div>

            {!isLoading &&
              rows.length > 0 &&
              rows.map((r) => {
                const action = parseAction(r.action);
                const ActionIcon = action.icon;
                const expanded = expandedId === r.id;
                const diff = diffEntries(r.before, r.after);
                return (
                  <div
                    key={r.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <button
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                      className={cn(
                        'grid w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50',
                        COLS,
                      )}
                    >
                      {/* When */}
                      <div className="min-w-0">
                        <div className="text-sm text-brand-black">
                          {shortDate(r.created_at)}
                        </div>
                        <div className="truncate text-xs text-gray-400">
                          {timeAgo(r.created_at)}
                        </div>
                      </div>

                      {/* Admin */}
                      <div className="flex min-w-0 items-center gap-3">
                        <AvatarBadge name={r.admin_email} />
                        <span className="truncate text-sm font-medium text-brand-black">
                          {r.admin_email}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="min-w-0">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                            action.tone,
                          )}
                        >
                          <ActionIcon className="size-3.5" />
                          {action.label}
                        </span>
                      </div>

                      {/* Target */}
                      <div className="min-w-0 text-sm text-gray-500">
                        <span className="capitalize">{r.target_type}</span>
                        {r.target_id && (
                          <span className="ml-1 font-mono text-xs text-gray-400">
                            {r.target_id.slice(0, 8)}…
                          </span>
                        )}
                      </div>

                      {/* Chevron */}
                      <div className="flex justify-end text-gray-300">
                        {expanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                        {diff.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            No payload recorded.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {diff.map((d) => (
                              <div
                                key={d.key}
                                className="grid grid-cols-[140px_1fr] gap-3 text-sm"
                              >
                                <span className="truncate text-gray-500">
                                  {d.key}
                                </span>
                                <span className="min-w-0 break-words">
                                  {d.changed ? (
                                    <>
                                      <span className="text-gray-400 line-through">
                                        {formatValue(d.before)}
                                      </span>
                                      <span className="mx-1.5 text-gray-400">
                                        →
                                      </span>
                                      <span className="font-medium text-brand-black">
                                        {formatValue(d.after)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-brand-black">
                                      {formatValue(d.after)}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {isLoading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">
            No audit entries found.
          </div>
        ) : null}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-brand-black transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-brand-black transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
