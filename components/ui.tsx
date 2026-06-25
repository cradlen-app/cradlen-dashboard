'use client';

import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

export function Button({
  className,
  variant = 'primary',
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
}) {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-700',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'hover:bg-slate-100',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200',
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  TRIAL: 'bg-blue-100 text-blue-800',
  VERIFIED: 'bg-green-100 text-green-800',
  PAID: 'bg-green-100 text-green-800',
  AWAITING_VERIFICATION: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-amber-100 text-amber-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
  SUSPENDED: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-slate-200 text-slate-700',
  REJECTED: 'bg-red-100 text-red-800',
  INACTIVE: 'bg-slate-200 text-slate-700',
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_TONE[status] ?? 'bg-slate-100 text-slate-700',
      )}
    >
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
