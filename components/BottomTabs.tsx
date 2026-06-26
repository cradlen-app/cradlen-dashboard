'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getOne } from '@/lib/api';
import type { AdminMetricsOverview } from '@/lib/types';
import { NAV_ITEMS, PRIMARY_TAB_HREFS, isNavActive } from './nav-items';
import { MoreSheet } from './MoreSheet';

const PRIMARY_ITEMS = PRIMARY_TAB_HREFS.map(
  (href) => NAV_ITEMS.find((item) => item.href === href)!,
);

export function BottomTabs() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Shares the cached overview query that powers the Payments badge.
  const { data: metrics } = useQuery({
    queryKey: ['metrics-overview'],
    queryFn: () => getOne<AdminMetricsOverview>('metrics/overview'),
    staleTime: 60_000,
  });
  const awaiting = metrics?.awaiting_payments_total ?? 0;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-gray-100 bg-white px-1 lg:hidden">
        {PRIMARY_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const active = isNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors',
                active ? 'text-brand-primary' : 'text-gray-400',
              )}
            >
              <span className="relative">
                <Icon className="size-5" />
                {badge && awaiting > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold leading-none text-white">
                    {awaiting > 9 ? '9+' : awaiting}
                  </span>
                )}
              </span>
              <span className="truncate">{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={cn(
            'flex flex-1 flex-col items-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors',
            moreOpen ? 'text-brand-primary' : 'text-gray-400',
          )}
        >
          <MoreHorizontal className="size-5" />
          <span className="truncate">More</span>
        </button>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
