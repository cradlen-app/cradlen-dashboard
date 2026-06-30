'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { getList, getOne, patchAction, postAction } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { AdminTeamMember, PlatformSettings } from '@/lib/types';
import { Spinner, Switch } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { Topbar } from '@/components/Topbar';
import { AvatarBadge } from '@/components/dashboard/AvatarBadge';
import { PushNotificationsCard } from '@/components/PushNotificationsCard';

const CURRENCIES: Record<string, string> = {
  EGP: 'EGP — Egyptian Pound',
  USD: 'USD — US Dollar',
  SAR: 'SAR — Saudi Riyal',
  AED: 'AED — UAE Dirham',
};

const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'bg-brand-primary/10 text-brand-primary',
  PENDING: 'bg-amber-100 text-amber-700',
  DISABLED: 'bg-gray-200 text-gray-600',
};

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => getOne<PlatformSettings>('settings'),
  });
  const adminsQuery = useQuery({
    queryKey: ['admins'],
    queryFn: () => getList<AdminTeamMember>('admins'),
  });

  const save = useMutation({
    mutationFn: (patch: Partial<PlatformSettings>) =>
      patchAction<PlatformSettings>('settings', patch),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const invite = useMutation({
    mutationFn: (body: { full_name: string; email: string }) =>
      postAction<AdminTeamMember>('admins', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setInviteOpen(false);
      setFullName('');
      setEmail('');
    },
  });

  const s = settingsQuery.data;

  return (
    <div>
      <Topbar title="Settings" subtitle="Platform configuration" />

      <div className="max-w-3xl space-y-6">
        {/* Payment collection */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-brand-black">
            Payment collection
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Accounts shown to clinics when they submit manual proofs.
          </p>

          <div className="mt-4 space-y-3">
            <EditableRow
              badge="IP"
              badgeTone="bg-brand-primary/10 text-brand-primary"
              label="InstaPay handle"
              value={s?.instapay_handle ?? ''}
              placeholder="cradlen@instapay"
              loading={!s}
              onSave={(v) => save.mutateAsync({ instapay_handle: v || null })}
            />
            <EditableRow
              badge="WL"
              badgeTone="bg-amber-100 text-amber-700"
              label="Wallet number"
              value={s?.wallet_number ?? ''}
              placeholder="+20 100 000 0000"
              loading={!s}
              onSave={(v) => save.mutateAsync({ wallet_number: v || null })}
            />
          </div>
        </section>

        {/* Platform defaults */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-brand-black">
            Platform defaults
          </h2>

          <div className="mt-4 divide-y divide-gray-100">
            <DefaultRow
              label="Free trial length"
              hint="Days before a new org must subscribe"
            >
              {s ? (
                <NumberEditor
                  value={s.free_trial_days}
                  suffix="days"
                  onSave={(v) => save.mutateAsync({ free_trial_days: v })}
                />
              ) : (
                <Dash />
              )}
            </DefaultRow>

            <DefaultRow
              label="Auto-verify gateway payments"
              hint="Manual proofs always need review"
            >
              {s ? (
                <Switch
                  checked={s.auto_verify_gateway_payments}
                  aria-label="Auto-verify gateway payments"
                  onChange={(v) =>
                    save.mutate({ auto_verify_gateway_payments: v })
                  }
                />
              ) : (
                <Dash />
              )}
            </DefaultRow>

            <DefaultRow label="Default currency" hint="Used for plan pricing">
              {s ? (
                <select
                  value={s.default_currency}
                  onChange={(e) =>
                    save.mutate({ default_currency: e.target.value })
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-brand-black outline-none focus:border-brand-primary"
                >
                  {Object.entries(CURRENCIES).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <Dash />
              )}
            </DefaultRow>
          </div>
        </section>

        {/* Push notifications */}
        <PushNotificationsCard />

        {/* Admin team */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-brand-black">
              Admin team
            </h2>
            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-primary/90"
            >
              <UserPlus className="size-4" />
              Invite admin
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {adminsQuery.isLoading ? (
              <Spinner />
            ) : !adminsQuery.data?.data.length ? (
              <p className="text-sm text-gray-400">No admins found.</p>
            ) : (
              adminsQuery.data.data.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <AvatarBadge name={a.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-brand-black">
                      {a.full_name}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {a.email}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      STATUS_TONE[a.status] ?? 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {a.status.toLowerCase()}
                  </span>
                </div>
              ))
            )}
          </div>

          <Modal
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            title="Invite new admin"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                They&apos;ll get an email with a link to set their password.
              </p>
              <input
                autoFocus
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              {invite.isError && (
                <p className="text-sm text-red-600">
                  {(invite.error as Error).message || 'Could not send invite.'}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setInviteOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-brand-black hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  disabled={
                    !fullName.trim() || !email.includes('@') || invite.isPending
                  }
                  onClick={() =>
                    invite.mutate({
                      full_name: fullName.trim(),
                      email: email.trim(),
                    })
                  }
                  className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {invite.isPending ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </div>
          </Modal>
        </section>
      </div>
    </div>
  );
}

function Dash() {
  return <span className="text-sm text-gray-400">—</span>;
}

function DefaultRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <div className="text-sm font-medium text-brand-black">{label}</div>
        <div className="text-xs text-gray-500">{hint}</div>
      </div>
      {children}
    </div>
  );
}

function EditableRow({
  badge,
  badgeTone,
  label,
  value,
  placeholder,
  loading,
  onSave,
}: {
  badge: string;
  badgeTone: string;
  label: string;
  value: string;
  placeholder: string;
  loading: boolean;
  onSave: (value: string) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);

  async function commit() {
    setBusy(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
          badgeTone,
        )}
      >
        {badge}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-brand-black">{label}</div>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none focus:border-brand-primary"
          />
        ) : (
          <div className="truncate text-xs text-gray-500">
            {loading ? '…' : value || placeholder}
          </div>
        )}
      </div>
      {editing ? (
        <div className="flex shrink-0 gap-2">
          <button
            onClick={commit}
            disabled={busy}
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          disabled={loading}
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-brand-black hover:bg-gray-50 disabled:opacity-50"
        >
          Edit
        </button>
      )}
    </div>
  );
}

function NumberEditor({
  value,
  suffix,
  onSave,
}: {
  value: number;
  suffix: string;
  onSave: (value: number) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        className="text-sm font-semibold text-brand-black hover:text-brand-primary"
      >
        {value} {suffix}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none focus:border-brand-primary"
      />
      <button
        onClick={async () => {
          await onSave(Number(draft));
          setEditing(false);
        }}
        className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-primary/90"
      >
        Save
      </button>
    </div>
  );
}

