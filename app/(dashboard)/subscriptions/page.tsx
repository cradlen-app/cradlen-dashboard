'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getList, postAction, qs } from '@/lib/api';
import type { SubscriptionListItem } from '@/lib/types';
import { Button, Input, PageHeader, StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/DataTable';
import { Modal } from '@/components/Modal';

const STATUSES = ['', 'TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED'];
const PLANS = ['individual', 'center', 'network'];

type ModalState =
  | { kind: 'extend'; sub: SubscriptionListItem }
  | { kind: 'change-plan'; sub: SubscriptionListItem }
  | null;

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [days, setDays] = useState('30');
  const [plan, setPlan] = useState(PLANS[0]);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', status, search, page],
    queryFn: () =>
      getList<SubscriptionListItem>(
        'subscriptions' + qs({ status, search, page, limit }),
      ),
  });

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ['subscriptions'] });

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

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Plans and billing state per tenant." />
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
              {s || 'All statuses'}
            </option>
          ))}
        </select>
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
            header: 'Organization',
            render: (s) => <span className="font-medium">{s.organization_name}</span>,
          },
          { header: 'Plan', render: (s) => s.plan },
          { header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
          {
            header: 'Ends',
            render: (s) =>
              s.ends_at ? new Date(s.ends_at).toLocaleDateString() : '—',
          },
          {
            header: '',
            className: 'text-right',
            render: (s) => (
              <div className="flex flex-wrap justify-end gap-1.5">
                <Button variant="outline" onClick={() => setModal({ kind: 'extend', sub: s })}>
                  Extend
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setModal({ kind: 'change-plan', sub: s })}
                >
                  Change plan
                </Button>
                {s.status === 'ACTIVE' || s.status === 'TRIAL' ? (
                  <Button
                    variant="danger"
                    onClick={() => simple.mutate({ id: s.id, verb: 'suspend' })}
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    onClick={() => simple.mutate({ id: s.id, verb: 'reactivate' })}
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={modal?.kind === 'extend'}
        onClose={() => setModal(null)}
        title="Extend subscription"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {modal?.sub.organization_name} — extend the end date by:
          </p>
          <Input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              loading={extend.isPending}
              onClick={() =>
                modal?.kind === 'extend' &&
                extend.mutate({ id: modal.sub.id, days: Number(days) })
              }
            >
              Extend {days} days
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal?.kind === 'change-plan'}
        onClose={() => setModal(null)}
        title="Change plan"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {modal?.sub.organization_name} — switch to:
          </p>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              loading={changePlan.isPending}
              onClick={() =>
                modal?.kind === 'change-plan' &&
                changePlan.mutate({ id: modal.sub.id, plan })
              }
            >
              Switch plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
