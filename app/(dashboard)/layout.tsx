'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getOne } from '@/lib/api';
import type { AdminMe } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { Spinner } from '@/components/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => getOne<AdminMe>('auth/me').catch(() => Promise.reject()),
    retry: false,
  });

  useEffect(() => {
    if (isError) router.replace('/login');
  }, [isError, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (isError || !data) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar me={data} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
