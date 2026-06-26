import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export function StatCard({
  label,
  value,
  sub,
  subTone,
  icon: Icon,
  iconTone = 'bg-gray-100 text-gray-500',
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  subTone?: string;
  icon: LucideIcon;
  iconTone?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-gray-500">{label}</span>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            iconTone,
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold text-brand-black">{value}</div>
      {sub && (
        <div className={cn('mt-1 text-sm', subTone ?? 'text-gray-400')}>{sub}</div>
      )}
    </Link>
  );
}
