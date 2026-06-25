'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getList, postAction, qs } from '@/lib/api';
import type { UserListItem } from '@/lib/types';
import { Button, Input, PageHeader, StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/DataTable';
import { Modal } from '@/components/Modal';

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [resetUser, setResetUser] = useState<UserListItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, page],
    queryFn: () => getList<UserListItem>('users' + qs({ search, page, limit })),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      postAction(`users/${id}/${active ? 'deactivate' : 'reactivate'}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const reset = useMutation({
    mutationFn: ({ id, pw }: { id: string; pw: string }) =>
      postAction(`users/${id}/reset-password`, { new_password: pw }),
    onSuccess: () => {
      setResetUser(null);
      setNewPassword('');
    },
  });

  return (
    <div>
      <PageHeader title="Users" subtitle="Every identity across all tenants." />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search name, email, phone…"
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
            header: 'Name',
            render: (u) => (
              <span className="font-medium">
                {u.first_name} {u.last_name}
              </span>
            ),
          },
          { header: 'Email', render: (u) => u.email ?? '—' },
          { header: 'Phone', render: (u) => u.phone_number ?? '—' },
          {
            header: 'Memberships',
            render: (u) => u.profile_count,
          },
          {
            header: 'Active',
            render: (u) => (
              <StatusBadge status={u.is_active ? 'ACTIVE' : 'INACTIVE'} />
            ),
          },
          {
            header: '',
            className: 'text-right',
            render: (u) => (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setResetUser(u)}
                >
                  Reset password
                </Button>
                <Button
                  variant={u.is_active ? 'danger' : 'primary'}
                  loading={toggle.isPending && toggle.variables?.id === u.id}
                  onClick={() => toggle.mutate({ id: u.id, active: u.is_active })}
                >
                  {u.is_active ? 'Deactivate' : 'Reactivate'}
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        title={`Reset password — ${resetUser?.first_name} ${resetUser?.last_name}`}
      >
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="New password (min 8 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {reset.isError && (
            <p className="text-sm text-red-600">
              Password must be at least 8 characters.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetUser(null)}>
              Cancel
            </Button>
            <Button
              loading={reset.isPending}
              disabled={newPassword.length < 8}
              onClick={() =>
                resetUser &&
                reset.mutate({ id: resetUser.id, pw: newPassword })
              }
            >
              Set password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
