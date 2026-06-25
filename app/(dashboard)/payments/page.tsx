'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getList, qs } from '@/lib/api';
import type { PaymentListItem } from '@/lib/types';
import { Input, PageHeader, StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/DataTable';

const STATUSES = [
  'AWAITING_VERIFICATION',
  '',
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'CANCELLED',
];

export default function PaymentsPage() {
  const router = useRouter();
  const [status, setStatus] = useState('AWAITING_VERIFICATION');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['payments', status, search, page],
    queryFn: () =>
      getList<PaymentListItem>(
        'subscription-payments' + qs({ status, search, page, limit }),
      ),
  });

  return (
    <div>
      <PageHeader
        title="Subscription payments"
        subtitle="Verify manual-proof payments and review billing history."
      />
      <div className="mb-4 flex gap-3">
        <Input
          className="max-w-sm"
          placeholder="Search by organization…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace(/_/g, ' ').toLowerCase() : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        rows={data?.data}
        loading={isLoading}
        onRowClick={(r) => router.push(`/payments/${r.id}`)}
        page={page}
        total={data?.meta.total}
        limit={limit}
        onPage={setPage}
        columns={[
          {
            header: 'Organization',
            render: (p) => <span className="font-medium">{p.organization_name}</span>,
          },
          { header: 'Plan', render: (p) => p.plan },
          {
            header: 'Amount',
            render: (p) => `${p.amount} ${p.currency}`,
          },
          { header: 'Provider', render: (p) => p.provider },
          { header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
          {
            header: 'Created',
            render: (p) => new Date(p.created_at).toLocaleDateString(),
          },
        ]}
      />
    </div>
  );
}
