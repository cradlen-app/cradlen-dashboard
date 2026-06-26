'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { UserMenu } from '@/components/UserMenu';

export function AppHeader() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(
      q ? `/organizations?search=${encodeURIComponent(q)}` : '/organizations',
    );
  }

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white">
      {/* Logo — aligned over the sidebar column */}
      <div className="flex w-60 shrink-0 items-center px-5">
        <Image
          src="/Logo.png"
          alt="Cradlen"
          width={120}
          height={28}
          priority
          className="h-7 w-auto"
        />
      </div>

      {/* Search + actions */}
      <div className="flex flex-1 items-center justify-end gap-3 px-6">
        <form onSubmit={onSubmit} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search organizations, contacts…"
            className="w-64 rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-brand-black outline-none transition-colors placeholder:text-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 lg:w-80"
          />
        </form>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
