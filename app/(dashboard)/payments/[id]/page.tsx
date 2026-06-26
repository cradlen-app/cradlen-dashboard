'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { getOne, postAction } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrencyFull } from '@/lib/format';
import type { PaymentDetail, PaymentItem } from '@/lib/types';
import { Spinner, StatusBadge } from '@/components/ui';
import { Topbar } from '@/components/Topbar';
import { Modal } from '@/components/Modal';
import { AvatarBadge } from '@/components/dashboard/AvatarBadge';

const PURPOSE_LABEL: Record<string, string> = {
  PLAN: 'Plan',
  ADD_ON: 'Add-on',
  COMBINED: 'Combined',
};

const PROVIDER_LABEL: Record<string, string> = {
  INSTAPAY: 'InstaPay',
  WALLET: 'Wallet',
};

function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Proof({
  url,
  contentType,
}: {
  url: string;
  contentType: string | null;
}) {
  const isImage = (contentType ?? '').startsWith('image/');
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="payment proof"
          className="w-full rounded-xl border border-gray-200"
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600 transition-colors hover:bg-gray-100">
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
    qc.invalidateQueries({ queryKey: ['metrics'] });
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

  if (isLoading || !data) {
    return (
      <div>
        <Topbar
          title="Payment"
          subtitle="Review and verify subscription payment"
        />
        <Spinner />
      </div>
    );
  }

  const actionable = data.status === 'AWAITING_VERIFICATION';
  const subtitle = [
    PURPOSE_LABEL[data.purpose] ?? data.purpose,
    data.plan.replace(/_/g, ' '),
    dateTime(data.created_at),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <Topbar
        title="Payment"
        subtitle="Review and verify subscription payment"
      />

      <Link
        href="/payments"
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-brand-black"
      >
        <ChevronLeft className="size-4" />
        Back to payments
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarBadge
            name={data.organization_name}
            className="size-12 text-sm"
          />
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-brand-black">
                {data.organization_name}
              </h2>
              <StatusBadge status={data.status} />
            </div>
            <p className="mt-0.5 text-sm capitalize text-gray-500">
              {subtitle}
            </p>
          </div>
        </div>
        {actionable && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setReason('');
                setRejecting(true);
              }}
              disabled={verify.isPending}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => verify.mutate()}
              disabled={verify.isPending}
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {verify.isPending ? 'Verifying…' : 'Verify & activate'}
            </button>
          </div>
        )}
      </div>

      {verify.isError && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not verify this payment. It may already be processed.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Proof */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-black">
            Payment proof
            {data.proofs.length > 1 ? ` (${data.proofs.length})` : ''}
          </h3>
          {data.proofs.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">No proof uploaded.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.proofs.map((p) => (
                <Proof key={p.id} url={p.url} contentType={p.content_type} />
              ))}
            </div>
          )}
        </section>

        {/* Details */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-black">Details</h3>
          <div className="mt-4 space-y-1">
            <InfoRow label="Organization" value={data.organization_name} />
            <InfoRow
              label="Submitted by"
              value={data.submitted_by_name ?? '—'}
            />
            {data.submitted_by_email && (
              <InfoRow label="Email" value={data.submitted_by_email} />
            )}
            {data.submitted_by_phone && (
              <InfoRow label="Phone" value={data.submitted_by_phone} />
            )}
            <Divider />
            <InfoRow
              label="Purpose"
              value={PURPOSE_LABEL[data.purpose] ?? data.purpose}
            />
            <InfoRow
              label="Plan"
              value={
                <span className="capitalize">
                  {data.plan.replace(/_/g, ' ')} ·{' '}
                  {data.billing_interval.toLowerCase()}
                </span>
              }
            />
            {data.items.length > 0 ? (
              <>
                {data.items.map((it, i) => (
                  <PaymentLine key={i} item={it} currency={data.currency} />
                ))}
                <Divider />
                <InfoRow
                  label="Total"
                  value={formatCurrencyFull(Number(data.amount), data.currency)}
                />
              </>
            ) : (
              <InfoRow
                label="Amount"
                value={formatCurrencyFull(Number(data.amount), data.currency)}
              />
            )}
            <Divider />
            <InfoRow
              label="Payment method"
              value={PROVIDER_LABEL[data.provider] ?? data.provider}
            />
            {data.reference && (
              <InfoRow label="Reference" value={data.reference} mono />
            )}
            <InfoRow label="Submitted" value={dateTime(data.created_at)} />
            {data.verified_at && (
              <InfoRow
                label={data.status === 'REJECTED' ? 'Rejected' : 'Verified'}
                value={dateTime(data.verified_at)}
              />
            )}
            {data.verified_by_name && (
              <InfoRow label="Actioned by" value={data.verified_by_name} />
            )}
            {data.rejection_reason && (
              <InfoRow
                label="Rejection reason"
                value={data.rejection_reason}
              />
            )}
          </div>
        </section>
      </div>

      {/* Reject modal */}
      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Reject payment"
      >
        <div className="space-y-4">
          <input
            placeholder="Reason (min 4 chars)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRejecting(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-brand-black transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={reason.trim().length < 4 || reject.isPending}
              onClick={() => reject.mutate(reason)}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              Reject payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span
        className={cn(
          'min-w-0 break-words text-right font-medium text-brand-black',
          mono && 'font-mono text-xs',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function PaymentLine({
  item,
  currency,
}: {
  item: PaymentItem;
  currency: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="min-w-0 break-words capitalize text-gray-500">
        {item.label.replace(/_/g, ' ')}
      </span>
      <span className="shrink-0 text-right">
        <span className="font-medium text-brand-black">
          {formatCurrencyFull(Number(item.amount), currency)}
        </span>
        {item.quantity > 1 && (
          <span className="block text-xs text-gray-500">
            {item.quantity} ×{' '}
            {formatCurrencyFull(Number(item.unit_amount), currency)}
          </span>
        )}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="my-2 border-t border-gray-100" />;
}
