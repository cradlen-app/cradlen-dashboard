'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { getOne } from '@/lib/api';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import type { AdminMe } from '@/lib/types';

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => getOne<AdminMe>('auth/me'),
  });

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  const name = me?.full_name ?? '…';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex h-10 items-center gap-2.5 rounded-full border border-transparent pl-1 pr-3 transition-colors hover:bg-brand-primary/8"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white ring-2 ring-white">
          {initials(me?.full_name)}
        </span>
        <span className="hidden flex-col items-start gap-0.5 leading-none sm:flex">
          <span className="whitespace-nowrap text-sm text-brand-black transition-colors group-hover:text-brand-primary">
            {name}
          </span>
          <span className="whitespace-nowrap text-[11px] leading-none text-brand-primary/70">
            Platform admin
          </span>
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-gray-400 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-br from-brand-primary/10 via-brand-secondary/5 to-transparent px-4 py-4">
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

            <div className="py-1">
              <MenuLink
                href="/settings"
                icon={User}
                label="View profile"
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href="/settings"
                icon={Settings}
                label="Account settings"
                onClick={() => setOpen(false)}
              />
            </div>

            <div className="border-t border-gray-100 py-1">
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof User;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2 text-sm font-medium text-brand-black transition-colors hover:bg-gray-50',
      )}
    >
      <Icon className="size-4 text-gray-400" />
      {label}
    </Link>
  );
}
