'use client';

import Image from 'next/image';
import Link from 'next/link';
import { NotificationBell } from '@/components/NotificationBell';
import { UserMenu } from '@/components/UserMenu';

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-100 bg-white px-6">
      <Link href="/" aria-label="Cradlen home" className="inline-flex shrink-0">
        <Image
          src="/Logo.png"
          alt="CRADLEN"
          width={120}
          height={28}
          priority
          className="h-7 w-auto"
        />
      </Link>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <div className="mx-1.5 hidden h-5 w-px bg-gray-200 lg:block" />
        <UserMenu />
      </div>
    </header>
  );
}
