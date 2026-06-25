'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOne, postAction } from '@/lib/api';
import type { PaymentDetail } from '@/lib/types';
import { Button, Card, Input, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { Modal } from '@/components/Modal';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Proof({ url, contentType }: { url: string; contentType: string | null }) {
  const isImage = (contentType ?? '').startsWith('image/');
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      {isImage ? (
        <img
          src={url}
          alt="payment proof"
          className="max-h-96 rounded-lg border border-slate-200"
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 hover:bg-slate-100">
          Open proof file ({contentType ?? 'file'})
        </div>
      )}
    </a>
  );
}

export default function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => getOne<PaymentDetail>(`subscription-payments/${id}`),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['payment', id] });
    qc.invalidateQueries({ queryKey: ['payments'] });
    qc.invalidateQueries({ queryKey: ['pending-payments'] });
  };

  const verify = useMutation({
    mutationFn: () => postAction(`subscription-payments/${id}/verify`),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: (reason: string) =>
      postAction(`subscription-payments/${id}/reject`, { reason }),
    onSuccess: () => {
      invalidate();
      setRejecting(false);
      setReason('');
    },
  });

  if (isLoading || !data) return <Spinner />;

  const actionable = data.status === 'AWAITING_VERIFICATION';

  return (
    <div className="max-w-3xl">
      <PageHeader title={data.organization_name} subtitle="Subscription payment">
        {actionable && (
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={() => setRejecting(true)}
              disabled={verify.isPending}
            >
              Reject
            </Button>
            <Button loading={verify.isPending} onClick={() => verify.mutate()}>
              Verify & activate
            </Button>
          </div>
        )}
      </PageHeader>

      {verify.isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not verify this payment. It may already be processed.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <Field label="Status" value={<StatusBadge status={data.status} />} />
          <Field label="Purpose" value={data.purpose} />
          <Field label="Plan" value={data.plan} />
          <Field label="Amount" value={`${data.amount} ${data.currency}`} />
          <Field label="Provider" value={data.provider} />
          <Field
            label="Created"
            value={new Date(data.created_at).toLocaleString()}
          />
          {data.verified_at && (
            <Field
              label="Verified"
              value={new Date(data.verified_at).toLocaleString()}
            />
          )}
          {data.rejection_reason && (
            <Field label="Rejection reason" value={data.rejection_reason} />
          )}
        </Card>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-600">
            Payment proof{data.proofs.length !== 1 ? 's' : ''}
          </h3>
          {data.proofs.length === 0 ? (
            <Card className="p-6 text-center text-sm text-slate-400">
              No proof uploaded.
            </Card>
          ) : (
            <div className="space-y-3">
              {data.proofs.map((p) => (
                <Proof key={p.id} url={p.url} contentType={p.content_type} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Reject payment"
      >
        <div className="space-y-4">
          <Input
            placeholder="Reason (min 4 chars)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={reject.isPending}
              disabled={reason.trim().length < 4}
              onClick={() => reject.mutate(reason)}
            >
              Reject payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
