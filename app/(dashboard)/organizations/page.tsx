'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import { getList, qs } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrencyFull } from '@/lib/format';
import type { OrganizationListItem } from '@/lib/types';
import { Spinner } from '@/components/ui';
import { Topbar } from '@/components/Topbar';
import { AvatarBadge } from '@/components/dashboard/AvatarBadge';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Trial', value: 'TRIAL' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const SUB_STATUS_TONE: Record<string, string> = {
  ACTIVE: 'text-brand-primary',
  TRIAL: 'text-amber-600',
  EXPIRED: 'text-red-500',
  CANCELLED: 'text-gray-400',
};

function subStatusLabel(status: string | null): string {
  if (!status) return '—';
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function OrganizationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [subStatus, setSubStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Reset to the first page whenever the filters change (adjust-state-on-render
  // pattern — avoids a cascading-render effect).
  const filterKey = `${search}|${subStatus}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading } = useQuery({
    queryKey: ['organizations', search, subStatus, page],
    queryFn: () =>
      getList<OrganizationListItem>(
        'organizations' +
          qs({ search, subscription_status: subStatus, page, limit }),
      ),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Topbar
        title="Organizations"
        subtitle={`${total} ${total === 1 ? 'organization' : 'organizations'} on the platform`}
      />

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setSubStatus(t.value)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              subStatus === t.value
                ? 'bg-brand-primary text-white'
                : 'bg-white text-brand-black/70 ring-1 ring-gray-200 hover:bg-gray-50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="grid grid-cols-[2.2fr_1.8fr_1fr_0.8fr_0.7fr_1fr_0.9fr_auto] gap-3 border-b border-gray-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">
          <span>Organization</span>
          <span>Primary contact</span>
          <span>Plan</span>
          <span>Branches</span>
          <span>Staff</span>
          <span>MRR</span>
          <span>Status</span>
          <span />
        </div>

        {isLoading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">
            No organizations found.
          </div>
        ) : (
          rows.map((o) => {
            const branchOver =
              o.branch_limit != null && o.branch_count >= o.branch_limit;
            const staffOver =
              o.staff_limit != null && o.staff_count >= o.staff_limit;
            return (
              <button
                key={o.id}
                onClick={() => router.push(`/organizations/${o.id}`)}
                className="grid w-full grid-cols-[2.2fr_1.8fr_1fr_0.8fr_0.7fr_1fr_0.9fr_auto] items-center gap-3 border-b border-gray-50 px-5 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <AvatarBadge name={o.name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-brand-black">
                      {o.name}
                    </div>
                    <div className="truncate text-xs capitalize text-gray-400">
                      {o.specialty ?? '—'}
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm text-brand-black">
                    {o.primary_contact_name ?? '—'}
                  </div>
                  <div className="truncate text-xs text-gray-400">
                    {o.primary_contact_email ?? ''}
                  </div>
                </div>

                <div>
                  {o.plan ? (
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-brand-black">
                      {o.plan.replace(/_/g, ' ')}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>

                <div
                  className={cn(
                    'flex items-center gap-1 text-sm',
                    branchOver ? 'font-medium text-red-500' : 'text-brand-black',
                  )}
                >
                  {branchOver && <TriangleAlert className="size-3.5" />}
                  {o.branch_count}
                </div>

                <div
                  className={cn(
                    'flex items-center gap-1 text-sm',
                    staffOver ? 'font-medium text-red-500' : 'text-brand-black',
                  )}
                >
                  {staffOver && <TriangleAlert className="size-3.5" />}
                  {o.staff_count}
                </div>

                <div className="text-sm font-medium text-brand-black">
                  {o.mrr != null ? formatCurrencyFull(o.mrr) : '—'}
                </div>

                <div
                  className={cn(
                    'text-sm font-medium',
                    SUB_STATUS_TONE[o.subscription_status ?? ''] ??
                      'text-gray-400',
                  )}
                >
                  {subStatusLabel(o.subscription_status)}
                </div>

                <ChevronRight className="size-4 text-gray-300" />
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
    </div>
  );
}

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OrganizationsContent />
    </Suspense>
  );
}
