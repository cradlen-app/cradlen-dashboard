'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getList, qs } from '@/lib/api';
import type { PaymentListItem } from '@/lib/types';
import { Card, PageHeader, StatusBadge, Spinner } from '@/components/ui';

function useCount(path: string) {
  return useQuery({
    queryKey: ['count', path],
    queryFn: async () => (await getList(path)).meta.total,
  });
}

function Stat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number | undefined;
  href: string;
  tone?: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 transition hover:shadow-md">
        <div className="text-sm text-slate-500">{label}</div>
        <div className={`mt-2 text-3xl font-semibold ${tone ?? ''}`}>
          {value ?? '—'}
        </div>
      </Card>
    </Link>
  );
}

export default function DashboardHome() {
  const orgs = useCount('organizations' + qs({ limit: 1 }));
  const users = useCount('users' + qs({ limit: 1 }));
  const activeSubs = useCount(
    'subscriptions' + qs({ status: 'ACTIVE', limit: 1 }),
  );
  const pending = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () =>
      getList<PaymentListItem>(
        'subscription-payments' +
          qs({ status: 'AWAITING_VERIFICATION', limit: 5 }),
      ),
  });

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Platform-wide organizations, users, and billing."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Organizations" value={orgs.data} href="/organizations" />
        <Stat label="Users" value={users.data} href="/users" />
        <Stat
          label="Active subscriptions"
          value={activeSubs.data}
          href="/subscriptions"
        />
        <Stat
          label="Payments to verify"
          value={pending.data?.meta.total}
          href="/payments"
          tone={pending.data?.meta.total ? 'text-amber-600' : ''}
        />
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold">
        Payments awaiting verification
      </h2>
      <Card className="divide-y divide-slate-100">
        {pending.isLoading ? (
          <Spinner />
        ) : !pending.data?.data.length ? (
          <div className="px-5 py-10 text-center text-slate-400">
            Nothing waiting. You&apos;re all caught up.
          </div>
        ) : (
          pending.data.data.map((p) => (
            <Link
              key={p.id}
              href={`/payments/${p.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
            >
              <div>
                <div className="font-medium">{p.organization_name}</div>
                <div className="text-sm text-slate-500">
                  {p.plan} · {p.amount} {p.currency} · {p.provider}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </Link>
          ))
        )}
      </Card>
    </div>
  );
}
