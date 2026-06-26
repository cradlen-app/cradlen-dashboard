'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, LogOut, X } from 'lucide-react';
import { getOne } from '@/lib/api';
import { initials } from '@/lib/format';
import type { AdminMe } from '@/lib/types';
import { NAV_ITEMS, PRIMARY_TAB_HREFS } from './nav-items';

const OVERFLOW_ITEMS = NAV_ITEMS.filter(
  (item) => !(PRIMARY_TAB_HREFS as readonly string[]).includes(item.href),
);

export function MoreSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => getOne<AdminMe>('auth/me'),
  });

  // Tear the overlay down once navigation has actually changed the route.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  async function logout() {
    onClose();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  const name = me?.full_name ?? '…';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white duration-200 animate-in fade-in-0 slide-in-from-bottom-4 motion-reduce:animate-none lg:hidden">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5">
        <span className="text-base font-semibold text-brand-black">Menu</span>
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-primary"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Account */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-br from-brand-primary/10 via-brand-secondary/5 to-transparent px-5 py-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white ring-2 ring-white">
            {initials(me?.full_name)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-brand-black">
              {name}
            </div>
            <div className="truncate text-xs text-gray-500">
              {me?.email ?? ''}
            </div>
          </div>
        </div>

        {/* Overflow nav */}
        <nav className="px-3 py-3">
          {OVERFLOW_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Icon className="size-5 shrink-0 text-gray-400" />
              <span className="flex-1 truncate">{label}</span>
              <ChevronRight className="size-4 shrink-0 text-gray-300" />
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 px-3 py-3">
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="size-5 shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
