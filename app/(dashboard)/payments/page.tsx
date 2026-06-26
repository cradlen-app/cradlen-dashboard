'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, Search, X } from 'lucide-react';
import { getList, postAction, qs } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrencyFull, timeAgo } from '@/lib/format';
import type { PaymentListItem } from '@/lib/types';
import { Spinner, StatusBadge } from '@/components/ui';
import { Topbar } from '@/components/Topbar';
import { Modal } from '@/components/Modal';
import { AvatarBadge } from '@/components/dashboard/AvatarBadge';

const TABS = [
  { label: 'Awaiting', value: 'AWAITING_VERIFICATION' },
  { label: 'All', value: '' },
  { label: 'Verified', value: 'VERIFIED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const PURPOSE_LABEL: Record<string, string> = {
  PLAN: 'Plan',
  ADD_ON: 'Add-on',
  COMBINED: 'Combined',
};

const PROVIDER_LABEL: Record<string, string> = {
  INSTAPAY: 'InstaPay',
  WALLET: 'Wallet',
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const COLS =
  'grid-cols-[2.4fr_1.6fr_1fr_1.2fr_1fr_0.9fr_minmax(120px,auto)]';

export default function PaymentsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [status, setStatus] = useState('AWAITING_VERIFICATION');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const limit = 20;

  // Reset to the first page whenever filters change (adjust-state-on-render).
  const filterKey = `${status}|${search}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading } = useQuery({
    queryKey: ['payments', status, search, page],
    queryFn: () =>
      getList<PaymentListItem>(
        'subscription-payments' + qs({ status, search, page, limit }),
      ),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['payments'] });
    qc.invalidateQueries({ queryKey: ['pending-payments'] });
    qc.invalidateQueries({ queryKey: ['metrics'] });
  };

  const verify = useMutation({
    mutationFn: (id: string) =>
      postAction(`subscription-payments/${id}/verify`),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      postAction(`subscription-payments/${id}/reject`, { reason }),
    onSuccess: () => {
      invalidate();
      setRejectId(null);
      setReason('');
    },
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Topbar
        title="Subscription payments"
        subtitle={`${total} ${total === 1 ? 'payment' : 'payments'} · verify manual-proof transfers`}
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                status === t.value
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-brand-black/70 ring-1 ring-gray-200 hover:bg-gray-50',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by organization…"
            className="w-64 rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-brand-black outline-none transition-colors placeholder:text-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div
          className={cn(
            'grid gap-3 border-b border-gray-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400',
            COLS,
          )}
        >
          <span>Organization</span>
          <span>What</span>
          <span>Amount</span>
          <span>Method</span>
          <span>Submitted</span>
          <span>Status</span>
          <span />
        </div>

        {isLoading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">
            No payments found.
          </div>
        ) : (
          rows.map((p) => {
            const awaiting = p.status === 'AWAITING_VERIFICATION';
            const busy =
              (verify.isPending && verify.variables === p.id) ||
              (reject.isPending && rejectId === p.id);
            return (
              <button
                key={p.id}
                onClick={() => router.push(`/payments/${p.id}`)}
                className={cn(
                  'grid w-full items-center gap-3 border-b border-gray-50 px-5 py-3 text-left transition-colors hover:bg-gray-50',
                  COLS,
                )}
              >
                {/* WHO */}
                <div className="flex items-center gap-3">
                  <AvatarBadge name={p.organization_name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-brand-black">
                      {p.organization_name}
                    </div>
                    <div className="truncate text-xs text-gray-400">
                      {p.submitted_by_name
                        ? `by ${p.submitted_by_name}`
                        : '—'}
                    </div>
                  </div>
                </div>

                {/* WHAT */}
                <div className="min-w-0">
                  <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-brand-black">
                    {PURPOSE_LABEL[p.purpose] ?? p.purpose}
                  </span>
                  <div className="mt-1 truncate text-xs capitalize text-gray-500">
                    {p.plan.replace(/_/g, ' ')} ·{' '}
                    {p.billing_interval.toLowerCase()}
                  </div>
                </div>

                {/* AMOUNT */}
                <div className="text-sm font-medium text-brand-black">
                  {formatCurrencyFull(Number(p.amount), p.currency)}
                </div>

                {/* PROVIDER */}
                <div className="min-w-0">
                  <div className="text-sm text-brand-black">
                    {PROVIDER_LABEL[p.provider] ?? p.provider}
                  </div>
                  {p.reference && (
                    <div className="truncate text-xs text-gray-400">
                      {p.reference}
                    </div>
                  )}
                </div>

                {/* WHEN */}
                <div className="min-w-0">
                  <div className="text-sm text-brand-black">
                    {shortDate(p.created_at)}
                  </div>
                  <div className="truncate text-xs text-gray-400">
                    {timeAgo(p.created_at)}
                  </div>
                </div>

                {/* STATUS */}
                <div>
                  <StatusBadge status={p.status} />
                </div>

                {/* ACTIONS */}
                <div className="flex items-center justify-end gap-2">
                  {awaiting ? (
                    <>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Verify payment"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!busy) verify.mutate(p.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!busy) verify.mutate(p.id);
                          }
                        }}
                        className={cn(
                          'inline-flex size-8 items-center justify-center rounded-lg bg-brand-primary text-white transition-colors hover:bg-brand-primary/90',
                          busy && 'pointer-events-none opacity-50',
                        )}
                      >
                        <Check className="size-4" />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Reject payment"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReason('');
                          setRejectId(p.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setReason('');
                            setRejectId(p.id);
                          }
                        }}
                        className={cn(
                          'inline-flex size-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50',
                          busy && 'pointer-events-none opacity-50',
                        )}
                      >
                        <X className="size-4" />
                      </span>
                    </>
                  ) : (
                    <ChevronRight className="size-4 text-gray-300" />
                  )}
                </div>
              </button>
            );
          })
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-5 py-3 text-sm text-gray-500">
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

      {/* Reject modal */}
      <Modal
        open={rejectId !== null}
        onClose={() => setRejectId(null)}
        title="Reject payment"
      >
        <div className="space-y-4">
          <input
            placeholder="Reason (min 4 chars)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRejectId(null)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-brand-black transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={reason.trim().length < 4 || reject.isPending}
              onClick={() =>
                rejectId && reject.mutate({ id: rejectId, reason })
              }
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              Reject payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
