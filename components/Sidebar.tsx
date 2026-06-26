'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CreditCard,
  LayoutGrid,
  LogOut,
  ReceiptText,
  ScrollText,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { getOne } from '@/lib/api';
import { initials } from '@/lib/format';
import type { AdminMe, AdminMetricsOverview } from '@/lib/types';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutGrid },
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/payments', label: 'Payments', icon: ReceiptText, badge: true },
  { href: '/audit-log', label: 'Audit log', icon: ScrollText },
];

export function Sidebar({ me }: { me: AdminMe | undefined }) {
  const pathname = usePathname();
  const router = useRouter();

  // Drives the red Payments badge; shares the cached overview query.
  const { data: metrics } = useQuery({
    queryKey: ['metrics-overview'],
    queryFn: () => getOne<AdminMetricsOverview>('metrics/overview'),
    staleTime: 60_000,
  });
  const awaiting = metrics?.awaiting_payments_total ?? 0;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-5">
        <Image
          src="/Logo.png"
          alt="Cradlen"
          width={140}
          height={28}
          priority
          className="h-auto w-28"
        />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-primary text-white'
                  : 'text-brand-black/70 hover:bg-brand-primary/5',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && awaiting > 0 && (
                <span
                  className={cn(
                    'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    active
                      ? 'bg-white text-brand-primary'
                      : 'bg-red-500 text-white',
                  )}
                >
                  {awaiting}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 px-3 pb-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive('/settings')
              ? 'bg-brand-primary text-white'
              : 'text-brand-black/70 hover:bg-brand-primary/5',
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>

        <div className="mt-1 flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
            {initials(me?.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-brand-black">
              {me?.full_name ?? '…'}
            </div>
            <div className="truncate text-xs text-gray-500">Platform admin</div>
          </div>
          <button
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-black"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
