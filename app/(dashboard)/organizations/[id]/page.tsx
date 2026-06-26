'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Mail, MapPin, Phone } from 'lucide-react';
import { getOne, postAction } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrencyFull, monthYear, timeAgo } from '@/lib/format';
import type { OrganizationDetail } from '@/lib/types';
import { Spinner, StatusBadge } from '@/components/ui';
import { Topbar } from '@/components/Topbar';
import { AvatarBadge } from '@/components/dashboard/AvatarBadge';

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => getOne<OrganizationDetail>(`organizations/${id}`),
  });

  const action = useMutation({
    mutationFn: (verb: 'suspend' | 'reactivate') =>
      postAction(`organizations/${id}/${verb}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization', id] }),
  });

  if (isLoading || !data) {
    return (
      <div>
        <Topbar
          title="Organization"
          subtitle="Manage subscription, branches and users"
        />
        <Spinner />
      </div>
    );
  }

  const suspended = data.status === 'SUSPENDED';
  const branches = data.branches ?? [];
  const recentActivity = data.recent_activity ?? [];
  const subtitle = [
    data.specialty,
    data.city,
    `Joined ${monthYear(data.created_at)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <Topbar
        title="Organization"
        subtitle="Manage subscription, branches and users"
      />

      <Link
        href="/organizations"
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-brand-black"
      >
        <ChevronLeft className="size-4" />
        Back to organizations
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarBadge name={data.name} className="size-12 text-sm" />
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-brand-black">
                {data.name}
              </h2>
              <StatusBadge status={data.subscription_status ?? data.status} />
            </div>
            <p className="mt-0.5 text-sm capitalize text-gray-500">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => action.mutate(suspended ? 'reactivate' : 'suspend')}
          disabled={action.isPending}
          className={cn(
            'rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
            suspended
              ? 'border-brand-primary text-brand-primary hover:bg-brand-primary/5'
              : 'border-red-200 text-red-600 hover:bg-red-50',
          )}
        >
          {suspended ? 'Reactivate' : 'Suspend'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Subscription */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-brand-black">
                Subscription
              </h3>
              {data.plan && (
                <span className="inline-flex rounded-full bg-brand-primary px-3 py-1 text-xs font-medium capitalize text-white">
                  {data.plan.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Billing</div>
                <div className="mt-0.5 text-sm font-medium text-brand-black">
                  {data.billing
                    ? `${formatCurrencyFull(data.billing.amount, data.billing.currency)} / ${data.billing.interval === 'YEARLY' ? 'year' : 'month'}`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Renews</div>
                <div className="mt-0.5 text-sm font-medium text-brand-black">
                  {data.subscription_ends_at
                    ? new Date(data.subscription_ends_at).toLocaleDateString(
                        'en-GB',
                        { day: '2-digit', month: 'short', year: 'numeric' },
                      )
                    : '—'}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <UsageBar
                label="Branches"
                value={data.branch_count}
                max={data.plan_limits?.max_branches ?? null}
              />
              <UsageBar
                label="Staff seats"
                value={data.staff_count}
                max={data.plan_limits?.max_staff ?? null}
                tone="secondary"
              />
            </div>
          </section>

          {/* Branches */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-base font-semibold text-brand-black">Branches</h3>
            <div className="mt-4 space-y-1">
              {branches.length === 0 ? (
                <p className="text-sm text-gray-400">No branches.</p>
              ) : (
                branches.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-gray-50"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-brand-primary">
                      <MapPin className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-brand-black">
                        {b.name}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {b.city} · {b.staff_count} staff
                      </div>
                    </div>
                    {b.is_main && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        main
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Primary contact */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-base font-semibold text-brand-black">
              Primary contact
            </h3>
            {data.owner ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <AvatarBadge name={data.owner.full_name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-brand-black">
                      {data.owner.full_name}
                    </div>
                    <div className="truncate text-xs capitalize text-gray-500">
                      Owner
                      {data.owner.specialty ? ` · ${data.owner.specialty}` : ''}
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {data.owner.email && (
                    <div className="flex items-center gap-2 text-brand-black">
                      <Mail className="size-4 text-gray-400" />
                      <span className="truncate">{data.owner.email}</span>
                    </div>
                  )}
                  {data.owner.phone && (
                    <div className="flex items-center gap-2 text-brand-black">
                      <Phone className="size-4 text-gray-400" />
                      <span className="truncate">{data.owner.phone}</span>
                    </div>
                  )}
                </div>
                {data.owner.email && (
                  <a
                    href={`mailto:${data.owner.email}`}
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
                  >
                    Email
                  </a>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-gray-400">No owner on record.</p>
            )}
          </section>

          {/* Company details */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-base font-semibold text-brand-black">
              Company details
            </h3>
            <div className="mt-4 space-y-1">
              <InfoRow label="Address" value={data.address?.address ?? '—'} />
              <InfoRow
                label="Governorate"
                value={data.address?.governorate ?? '—'}
              />
              <InfoRow label="Country" value={data.address?.country ?? '—'} />
              <InfoRow label="Org ID" value={data.id} mono />
            </div>
          </section>

          {/* Recent activity */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-base font-semibold text-brand-black">
              Recent activity
            </h3>
            <div className="mt-4 space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet.</p>
              ) : (
                recentActivity.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-primary" />
                    <div className="min-w-0">
                      <div className="text-sm text-brand-black">{a.title}</div>
                      <div className="text-xs text-gray-400">
                        {timeAgo(a.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  value,
  max,
  tone = 'primary',
}: {
  label: string;
  value: number;
  max: number | null;
  tone?: 'primary' | 'secondary';
}) {
  const pct = max && max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max != null && value > max;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-brand-black">
          {value}
          {max != null ? ` / ${max}` : ''}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            'h-full rounded-full',
            over
              ? 'bg-red-500'
              : tone === 'secondary'
                ? 'bg-brand-secondary'
                : 'bg-brand-primary',
          )}
          style={{ width: `${max != null ? pct : 0}%` }}
        />
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span
        className={cn(
          'truncate text-right font-medium text-brand-black',
          mono && 'font-mono text-xs',
        )}
      >
        {value}
      </span>
    </div>
  );
}
