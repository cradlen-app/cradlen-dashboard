'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getList, qs } from '@/lib/api';
import type { OrganizationListItem, Paginated } from '@/lib/types';
import { Input, PageHeader, StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/DataTable';

export default function OrganizationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['organizations', search, page],
    queryFn: () =>
      getList<OrganizationListItem>(
        'organizations' + qs({ search, page, limit }),
      ),
  });
  const res = data as Paginated<OrganizationListItem> | undefined;

  return (
    <div>
      <PageHeader title="Organizations" subtitle="Every tenant on the platform." />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <DataTable
        rows={res?.data}
        loading={isLoading}
        onRowClick={(r) => router.push(`/organizations/${r.id}`)}
        page={page}
        total={res?.meta.total}
        limit={limit}
        onPage={setPage}
        columns={[
          { header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
          { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { header: 'Plan', render: (r) => r.plan ?? '—' },
          {
            header: 'Subscription',
            render: (r) => <StatusBadge status={r.subscription_status} />,
          },
          { header: 'Branches', render: (r) => r.branch_count },
          { header: 'Staff', render: (r) => r.staff_count },
        ]}
      />
    </div>
  );
}
