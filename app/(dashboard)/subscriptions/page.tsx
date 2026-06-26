'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  LineChart,
  Search,
  XCircle,
} from 'lucide-react';
import { getList, getOne, postAction, qs } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrencyFull, formatCurrencyShort } from '@/lib/format';
import type {
  SubscriptionListItem,
  SubscriptionPlanOption,
  SubscriptionStats,
} from '@/lib/types';
import { Spinner, StatusBadge } from '@/components/ui';
import { Topbar } from '@/components/Topbar';
import { Modal } from '@/components/Modal';
import { StatCard } from '@/components/dashboard/StatCard';
import { PlanDistribution } from '@/components/dashboard/PlanDistribution';
import { AvatarBadge } from '@/components/dashboard/AvatarBadge';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Trial', value: 'TRIAL' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const COLS =
  'grid-cols-[2fr_1.5fr_0.9fr_1.1fr_1.4fr_0.9fr_minmax(230px,auto)]';

type ModalState =
  | { kind: 'extend'; sub: SubscriptionListItem }
  | { kind: 'change-plan'; sub: SubscriptionListItem }
  | null;

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Compact relative descriptor for a future renewal/expiry date. */
function renewsLabel(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'today';
  if (days < 60) return `in ${days}d`;
  return `in ${Math.round(days / 30)} mo`;
}

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [days, setDays] = useState('30');
  const [plan, setPlan] = useState('');
  const limit = 20;

  // Reset to the first page whenever filters change (adjust-state-on-render).
  const filterKey = `${status}|${search}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const statsQuery = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: () => getOne<SubscriptionStats>('subscriptions/stats'),
  });

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => getOne<SubscriptionPlanOption[]>('subscriptions/plans'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', status, search, page],
    queryFn: () =>
      getList<SubscriptionListItem>(
        'subscriptions' + qs({ status, search, page, limit }),
      ),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['subscriptions'] });
    qc.invalidateQueries({ queryKey: ['subscription-stats'] });
    qc.invalidateQueries({ queryKey: ['metrics-overview'] });
  };

  const simple = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: string }) =>
      postAction(`subscriptions/${id}/${verb}`),
    onSuccess: refresh,
  });
  const extend = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      postAction(`subscriptions/${id}/extend`, { days }),
    onSuccess: () => {
      refresh();
      setModal(null);
    },
  });
  const changePlan = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) =>
      postAction(`subscriptions/${id}/change-plan`, { plan }),
    onSuccess: () => {
      refresh();
      setModal(null);
    },
  });

  const stats = statsQuery.data;
  const plans = plansQuery.data ?? [];
  const currency = stats?.currency ?? 'EGP';
  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Topbar
        title="Subscriptions"
        subtitle={
          stats
            ? `${stats.total} subscriptions · ${stats.active} active`
            : 'Plans and billing state per tenant'
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active"
          value={stats?.active ?? '—'}
          sub={stats ? `of ${stats.total} total` : undefined}
          icon={CheckCircle2}
          iconTone="bg-brand-primary/10 text-brand-primary"
          href="/subscriptions"
        />
        <StatCard
          label="Trials"
          value={stats?.trial ?? '—'}
          sub="In free-trial period"
          icon={Clock}
          iconTone="bg-brand-primary/10 text-brand-primary"
          href="/subscriptions"
        />
        <StatCard
          label="Monthly recurring"
          value={stats ? formatCurrencyShort(stats.mrr, currency) : '—'}
          sub="From active plans"
          subTone="text-brand-primary"
          icon={LineChart}
          iconTone="bg-brand-primary/10 text-brand-primary"
          href="/subscriptions"
        />
        <StatCard
          label="Expired / cancelled"
          value={stats ? stats.expired + stats.cancelled : '—'}
          sub="No longer billing"
          icon={XCircle}
          iconTone="bg-gray-100 text-gray-500"
          href="/subscriptions"
        />
      </div>

      {/* Plan distribution */}
      <div className="mt-6">
        <PlanDistribution items={stats?.plan_distribution ?? []} />
      </div>

      {/* Filters */}
      <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
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
        <div className="relative w-full sm:w-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by organization…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-brand-black outline-none transition-colors placeholder:text-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 sm:w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* Horizontally scrollable on small screens; natural fit at lg+ */}
        <div className="overflow-x-auto">
          <div className="min-w-[1100px] lg:min-w-0">
            <div
              className={cn(
                'grid gap-3 border-b border-gray-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400',
                COLS,
              )}
            >
              <span>Organization</span>
              <span>Plan</span>
              <span>Status</span>
              <span>Renews</span>
              <span>Add-ons</span>
              <span>MRR</span>
              <span />
            </div>

            {!isLoading &&
              rows.length > 0 &&
              rows.map((s) => {
                const renewAt =
                  s.status === 'TRIAL' ? s.trial_ends_at : s.ends_at;
                const active = s.status === 'ACTIVE' || s.status === 'TRIAL';
                const busy = simple.isPending && simple.variables?.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      'grid items-center gap-3 border-b border-gray-50 px-5 py-3',
                      COLS,
                    )}
                  >
                    {/* Organization */}
                    <div className="flex min-w-0 items-center gap-3">
                      <AvatarBadge name={s.organization_name} />
                      <Link
                        href={`/organizations/${s.organization_id}`}
                        className="truncate text-sm font-medium text-brand-black transition-colors hover:text-brand-primary"
                      >
                        {s.organization_name}
                      </Link>
                    </div>

                    {/* Plan */}
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-brand-black">
                        {s.plan.replace(/_/g, ' ')}
                      </span>
                      <div className="mt-1 truncate text-xs text-gray-500">
                        {s.amount != null
                          ? `${formatCurrencyFull(s.amount, s.currency ?? currency)} · ${(
                              s.billing_interval ?? ''
                            ).toLowerCase()}`
                          : '—'}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <StatusBadge status={s.status} />
                    </div>

                    {/* Renews */}
                    <div className="min-w-0">
                      {renewAt ? (
                        <>
                          <div className="text-sm text-brand-black">
                            {shortDate(renewAt)}
                          </div>
                          <div className="truncate text-xs text-gray-400">
                            {renewsLabel(renewAt)}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    {/* Add-ons */}
                    <div className="min-w-0">
                      {s.add_ons.length > 0 ? (
                        <div className="space-y-0.5">
                          {s.add_ons.map((a, i) => (
                            <div
                              key={i}
                              className="truncate text-xs text-brand-black"
                            >
                              <span className="capitalize">
                                {a.name.replace(/_/g, ' ')}
                              </span>
                              <span className="text-gray-400"> ×{a.quantity}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    {/* MRR */}
                    <div className="text-sm font-medium text-brand-black">
                      {s.mrr != null
                        ? formatCurrencyShort(s.mrr, s.currency ?? currency)
                        : '—'}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setDays('30');
                          setModal({ kind: 'extend', sub: s });
                        }}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-brand-black transition-colors hover:bg-gray-50"
                      >
                        Extend
                      </button>
                      <button
                        onClick={() => {
                          setPlan(s.plan);
                          setModal({ kind: 'change-plan', sub: s });
                        }}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-brand-black transition-colors hover:bg-gray-50"
                      >
                        Change plan
                      </button>
                      {active ? (
                        <button
                          disabled={busy}
                          onClick={() =>
                            simple.mutate({ id: s.id, verb: 'suspend' })
                          }
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={() =>
                            simple.mutate({ id: s.id, verb: 'reactivate' })
                          }
                          className="rounded-lg bg-brand-primary px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {isLoading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">
            No subscriptions found.
          </div>
        ) : null}

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

      {/* Extend modal */}
      <Modal
        open={modal?.kind === 'extend'}
        onClose={() => setModal(null)}
        title="Extend subscription"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {modal?.sub.organization_name} — extend the end date by:
          </p>
          <input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setModal(null)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-brand-black transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={Number(days) < 1 || extend.isPending}
              onClick={() =>
                modal?.kind === 'extend' &&
                extend.mutate({ id: modal.sub.id, days: Number(days) })
              }
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
            >
              Extend {days} days
            </button>
          </div>
        </div>
      </Modal>

      {/* Change-plan modal */}
      <Modal
        open={modal?.kind === 'change-plan'}
        onClose={() => setModal(null)}
        title="Change plan"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {modal?.sub.organization_name} — currently on{' '}
            <span className="font-medium capitalize text-brand-black">
              {modal?.sub.plan.replace(/_/g, ' ')}
            </span>
            . Switch to:
          </p>
          {plansQuery.isLoading ? (
            <Spinner />
          ) : (
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm capitalize text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            >
              {plans.map((p) => (
                <option key={p.plan} value={p.plan}>
                  {p.plan.replace(/_/g, ' ')}
                  {p.amount != null
                    ? ` — ${formatCurrencyFull(p.amount, p.currency ?? currency)} / ${(
                        p.billing_interval ?? ''
                      ).toLowerCase()}`
                    : ''}
                </option>
              ))}
            </select>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setModal(null)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-brand-black transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={
                !plan ||
                plan === modal?.sub.plan ||
                changePlan.isPending
              }
              onClick={() =>
                modal?.kind === 'change-plan' &&
                changePlan.mutate({ id: modal.sub.id, plan })
              }
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
            >
              Switch plan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
