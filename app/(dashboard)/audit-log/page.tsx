'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getList, qs } from '@/lib/api';
import type { AuditLogEntry } from '@/lib/types';
import { Input, PageHeader } from '@/components/ui';
import { DataTable } from '@/components/DataTable';

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', search, page],
    queryFn: () =>
      getList<AuditLogEntry>('audit-log' + qs({ search, page, limit })),
  });

  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="Every platform-admin write action, in order."
      />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search action, target…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <DataTable
        rows={data?.data}
        loading={isLoading}
        page={page}
        total={data?.meta.total}
        limit={limit}
        onPage={setPage}
        columns={[
          {
            header: 'When',
            render: (r) => new Date(r.created_at).toLocaleString(),
          },
          { header: 'Admin', render: (r) => r.admin_email },
          {
            header: 'Action',
            render: (r) => (
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">
                {r.action}
              </span>
            ),
          },
          {
            header: 'Target',
            render: (r) => (
              <span className="text-slate-500">
                {r.target_type}
                {r.target_id ? ` · ${r.target_id.slice(0, 8)}…` : ''}
              </span>
            ),
          },
          {
            header: 'Change',
            render: (r) =>
              r.before || r.after ? (
                <code className="text-xs text-slate-500">
                  {JSON.stringify(r.after)}
                </code>
              ) : (
                '—'
              ),
          },
        ]}
      />
    </div>
  );
}
