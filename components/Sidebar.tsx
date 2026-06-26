'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getOne } from '@/lib/api';
import type { AdminMetricsOverview } from '@/lib/types';
import { NAV_GROUPS, SETTINGS_ITEM, isNavActive, type NavItem } from './nav-items';

function NavLink({
  item: { href, label, icon: Icon, badge },
  active,
  awaiting,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  awaiting: number;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/20'
          : 'text-gray-400 hover:bg-gray-50 hover:text-brand-black',
      )}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge && awaiting > 0 && (
        <span
          className={cn(
            'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold',
            active ? 'bg-white text-brand-primary' : 'bg-red-500 text-white',
          )}
        >
          {awaiting}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Drives the red Payments badge; shares the cached overview query.
  const { data: metrics } = useQuery({
    queryKey: ['metrics-overview'],
    queryFn: () => getOne<AdminMetricsOverview>('metrics/overview'),
    staleTime: 60_000,
  });
  const awaiting = metrics?.awaiting_payments_total ?? 0;

  return (
    <aside
      className={cn(
        'relative flex h-full shrink-0 flex-col border-r border-gray-100 bg-white transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'mt-2 hidden shrink-0 rounded-md p-0.5 text-gray-400 transition-colors hover:text-brand-primary lg:block',
          collapsed ? 'mx-auto' : 'me-2 ms-auto',
        )}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </button>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            {collapsed ? (
              <div className="pt-3" />
            ) : (
              <div className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {group.heading}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isNavActive(item.href, pathname)}
                  awaiting={awaiting}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-2 py-3">
        {!collapsed && (
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Settings
          </div>
        )}
        <NavLink
          item={SETTINGS_ITEM}
          active={isNavActive(SETTINGS_ITEM.href, pathname)}
          awaiting={awaiting}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
