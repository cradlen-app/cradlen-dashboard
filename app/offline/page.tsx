import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "You're offline · Cradlen Admin",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 text-center">
      <Image
        src="/icon-192x192.png"
        alt="Cradlen"
        width={72}
        height={72}
        unoptimized
        className="h-18 w-18 opacity-90"
      />
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-brand-black">
          You&apos;re offline
        </h1>
        <p className="max-w-sm text-sm text-gray-500">
          Cradlen Admin needs a connection to load live data. Check your network
          and try again.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
      >
        Try again
      </Link>
    </main>
  );
}
