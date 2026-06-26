'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  LineChart,
  UserCheck,
} from 'lucide-react';
import { getList, getOne, qs } from '@/lib/api';
import {
  formatCurrencyFull,
  formatCurrencyShort,
  monthYear,
  timeAgo,
} from '@/lib/format';
import type {
  AdminDailyMetricPoint,
  AdminMetricsOverview,
  OrganizationListItem,
  PaymentListItem,
} from '@/lib/types';
import { StatusBadge, Spinner } from '@/components/ui';
import { Topbar } from '@/components/Topbar';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { DailyTrendChart } from '@/components/dashboard/DailyTrendChart';
import { PlanDistribution } from '@/components/dashboard/PlanDistribution';
import { AvatarBadge } from '@/components/dashboard/AvatarBadge';

export default function DashboardHome() {
  const metricsQuery = useQuery({
    queryKey: ['metrics-overview'],
    queryFn: () => getOne<AdminMetricsOverview>('metrics/overview'),
  });
  const pending = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () =>
      getList<PaymentListItem>(
        'subscription-payments' +
          qs({ status: 'AWAITING_VERIFICATION', limit: 5 }),
      ),
  });
  const recent = useQuery({
    queryKey: ['recent-orgs'],
    queryFn: () =>
      getList<OrganizationListItem>('organizations' + qs({ limit: 4 })),
  });
  const dailyTrends = useQuery({
    queryKey: ['daily-trends'],
    queryFn: () =>
      getOne<AdminDailyMetricPoint[]>('metrics/daily-trends' + qs({ days: 30 })),
  });

  const m = metricsQuery.data;
  const currency = m?.currency ?? 'EGP';

  // MoM change indicator — fall back when there's no prior month to compare to.
  let mrrSub: string | undefined;
  let mrrTone = 'text-brand-primary';
  if (m) {
    if (m.mrr_change_pct != null) {
      const up = m.mrr_change_pct >= 0;
      mrrSub = `${up ? '▲' : '▼'} ${Math.abs(m.mrr_change_pct)}% MoM`;
      mrrTone = up ? 'text-brand-primary' : 'text-red-500';
    } else if (m.monthly_recurring_revenue > 0) {
      mrrSub = 'New this month';
      mrrTone = 'text-brand-primary';
    } else {
      mrrSub = 'No revenue yet';
      mrrTone = 'text-gray-400';
    }
  }

  return (
    <div>
      <Topbar
        title="Overview"
        subtitle="Platform health across all organizations"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Organizations"
          value={m?.organizations_total ?? '—'}
          sub={
            m ? `+${m.organizations_added_this_month} this month` : undefined
          }
          subTone="text-brand-primary"
          icon={Building2}
          iconTone="bg-brand-primary/10 text-brand-primary"
          href="/organizations"
        />
        <StatCard
          label="Active subscriptions"
          value={m?.active_subscriptions ?? '—'}
          sub={
            m
              ? `${m.active_subscriptions} of ${m.organizations_total} orgs`
              : undefined
          }
          icon={CheckCircle2}
          iconTone="bg-brand-primary/10 text-brand-primary"
          href="/subscriptions"
        />
        <StatCard
          label="Monthly recurring"
          value={
            m ? formatCurrencyShort(m.monthly_recurring_revenue, currency) : '—'
          }
          sub={mrrSub}
          subTone={mrrTone}
          icon={LineChart}
          iconTone="bg-brand-primary/10 text-brand-primary"
          href="/subscriptions"
        />
        <StatCard
          label="Awaiting payments"
          value={m?.awaiting_payments_total ?? '—'}
          sub="Needs your review"
          subTone="text-red-500"
          icon={AlertCircle}
          iconTone="bg-red-50 text-red-500"
          href="/payments"
        />
        <StatCard
          label="Portal accounts"
          value={m?.portal_accounts_total ?? '—'}
          sub={
            m && m.portal_activation_rate != null
              ? `${m.portal_activation_rate}% activation`
              : undefined
          }
          subTone="text-brand-primary"
          icon={UserCheck}
          iconTone="bg-brand-primary/10 text-brand-primary"
          href="/organizations"
        />
      </div>

      {/* Revenue + plan distribution */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {m ? (
            <RevenueChart
              history={m.revenue_history}
              total={m.monthly_recurring_revenue}
              changePct={m.mrr_change_pct}
              currency={currency}
            />
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white">
              <Spinner />
            </div>
          )}
        </div>
        <PlanDistribution items={m?.plan_distribution ?? []} />
      </div>

      {/* Daily engagement trend */}
      <div className="mt-6">
        {dailyTrends.data ? (
          <DailyTrendChart data={dailyTrends.data} />
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <Spinner />
          </div>
        )}
      </div>

      {/* Lists */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Payments awaiting verification */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-brand-black">
                Payments awaiting verification
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manual InstaPay &amp; wallet proofs needing review
              </p>
            </div>
            <Link
              href="/payments"
              className="flex items-center gap-1 text-sm font-medium text-brand-black hover:text-brand-primary"
            >
              View queue <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-gray-100">
            {pending.isLoading ? (
              <Spinner />
            ) : !pending.data?.data.length ? (
              <div className="py-10 text-center text-sm text-gray-400">
                Nothing waiting. You&apos;re all caught up.
              </div>
            ) : (
              pending.data.data.map((p) => (
                <Link
                  key={p.id}
                  href={`/payments/${p.id}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-gray-50"
                >
                  <AvatarBadge name={p.organization_name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-brand-black">
                      {p.organization_name}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      <span className="capitalize">{p.plan}</span>
                      {p.reference ? ` · ref ${p.reference}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-brand-black">
                      {formatCurrencyFull(Number(p.amount), p.currency)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {timeAgo(p.created_at)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recently added */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-brand-black">
            Recently added
          </h2>
          <p className="mt-1 text-sm text-gray-500">Newest organizations</p>

          <div className="mt-4 divide-y divide-gray-100">
            {recent.isLoading ? (
              <Spinner />
            ) : !recent.data?.data.length ? (
              <div className="py-10 text-center text-sm text-gray-400">
                No organizations yet.
              </div>
            ) : (
              recent.data.data.map((o) => (
                <Link
                  key={o.id}
                  href={`/organizations/${o.id}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-gray-50"
                >
                  <AvatarBadge name={o.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-brand-black">
                      {o.name}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {[o.city, monthYear(o.created_at)]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <StatusBadge status={o.subscription_status ?? o.status} />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
