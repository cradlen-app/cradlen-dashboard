'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CreditCard,
  LayoutGrid,
  ReceiptText,
  ScrollText,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { getOne } from '@/lib/api';
import type { AdminMetricsOverview } from '@/lib/types';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
};

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Overview',
    items: [{ href: '/', label: 'Overview', icon: LayoutGrid }],
  },
  {
    heading: 'Management',
    items: [
      { href: '/organizations', label: 'Organizations', icon: Building2 },
      { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { href: '/payments', label: 'Payments', icon: ReceiptText, badge: true },
    ],
  },
  {
    heading: 'Activity',
    items: [{ href: '/audit-log', label: 'Audit log', icon: ScrollText }],
  },
];

const SETTINGS_ITEM: NavItem = {
  href: '/settings',
  label: 'Settings',
  icon: Settings,
};

function NavLink({
  item: { href, label, icon: Icon, badge },
  active,
  awaiting,
}: {
  item: NavItem;
  active: boolean;
  awaiting: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-brand-primary/10 font-semibold text-brand-primary'
          : 'font-medium text-brand-black/70 hover:bg-brand-primary/5',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && awaiting > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
          {awaiting}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  // Drives the red Payments badge; shares the cached overview query.
  const { data: metrics } = useQuery({
    queryKey: ['metrics-overview'],
    queryFn: () => getOne<AdminMetricsOverview>('metrics/overview'),
    staleTime: 60_000,
  });
  const awaiting = metrics?.awaiting_payments_total ?? 0;

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
      {/* Grouped nav */}
      <nav className="flex-1 px-3 pt-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <div className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {group.heading}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  awaiting={awaiting}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings pinned at the bottom */}
      <div className="px-3 pb-4">
        <div className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Settings
        </div>
        <NavLink
          item={SETTINGS_ITEM}
          active={isActive(SETTINGS_ITEM.href)}
          awaiting={awaiting}
        />
      </div>
    </aside>
  );
}
