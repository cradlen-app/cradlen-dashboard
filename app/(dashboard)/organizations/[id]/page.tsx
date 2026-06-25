'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOne, postAction } from '@/lib/api';
import type { OrganizationDetail } from '@/lib/types';
import { Button, Card, PageHeader, Spinner, StatusBadge } from '@/components/ui';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

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

  if (isLoading || !data) return <Spinner />;

  const suspended = data.status === 'SUSPENDED';

  return (
    <div className="max-w-2xl">
      <PageHeader title={data.name} subtitle="Organization detail">
        {suspended ? (
          <Button
            loading={action.isPending}
            onClick={() => action.mutate('reactivate')}
          >
            Reactivate
          </Button>
        ) : (
          <Button
            variant="danger"
            loading={action.isPending}
            onClick={() => action.mutate('suspend')}
          >
            Suspend organization
          </Button>
        )}
      </PageHeader>

      <Card className="p-5">
        <Field label="Status" value={<StatusBadge status={data.status} />} />
        <Field
          label="Subscription"
          value={<StatusBadge status={data.subscription_status} />}
        />
        <Field label="Plan" value={data.plan ?? '—'} />
        <Field label="Branches" value={data.branch_count} />
        <Field label="Staff" value={data.staff_count} />
        <Field
          label="Subscription ends"
          value={
            data.subscription_ends_at
              ? new Date(data.subscription_ends_at).toLocaleDateString()
              : '—'
          }
        />
        <Field
          label="Trial ends"
          value={
            data.trial_ends_at
              ? new Date(data.trial_ends_at).toLocaleDateString()
              : '—'
          }
        />
        <Field
          label="Created"
          value={new Date(data.created_at).toLocaleDateString()}
        />
      </Card>
    </div>
  );
}
