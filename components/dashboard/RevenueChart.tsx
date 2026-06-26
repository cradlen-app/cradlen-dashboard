import { cn } from '@/lib/cn';
import { formatCurrencyFull, monthShort } from '@/lib/format';
import type { RevenuePoint } from '@/lib/types';

export function RevenueChart({
  history,
  total,
  changePct,
  currency,
}: {
  history: RevenuePoint[];
  total: number;
  changePct: number | null;
  currency: string;
}) {
  const max = Math.max(1, ...history.map((p) => p.amount));
  const up = (changePct ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-brand-black">
            Monthly recurring revenue
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Last {history.length} months · {currency}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-brand-black">
            {formatCurrencyFull(total, currency)}
          </div>
          {changePct !== null && (
            <div
              className={cn(
                'text-sm font-medium',
                up ? 'text-brand-primary' : 'text-red-500',
              )}
            >
              {up ? '▲' : '▼'} {Math.abs(changePct)}% vs last month
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex h-44 items-end gap-2">
        {history.map((p, i) => {
          const isLast = i === history.length - 1;
          const heightPct = Math.max(4, (p.amount / max) * 100);
          return (
            <div key={p.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end">
                <div
                  className={cn(
                    'w-full rounded-md',
                    isLast ? 'bg-brand-primary' : 'bg-brand-secondary/40',
                  )}
                  style={{ height: `${heightPct}%` }}
                  title={formatCurrencyFull(p.amount, currency)}
                />
              </div>
              <span className="text-xs text-gray-400">{monthShort(p.month)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
