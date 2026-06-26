import { cn } from '@/lib/cn';
import type { PlanDistributionItem } from '@/lib/types';

// Escalating green→black tones, assigned by row order to echo the mockup.
const TONES = [
  'bg-brand-secondary/60',
  'bg-brand-secondary',
  'bg-brand-primary',
  'bg-brand-black',
];

export function PlanDistribution({
  items,
}: {
  items: PlanDistributionItem[];
}) {
  const max = Math.max(1, ...items.map((p) => p.count));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-brand-black">Plan distribution</h2>
      <p className="mt-1 text-sm text-gray-500">Active subscriptions by plan</p>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">No active subscriptions yet.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((p, i) => (
            <div key={p.plan}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="capitalize text-brand-black">
                  {p.plan.replace(/_/g, ' ')}
                </span>
                <span className="font-medium text-brand-black">{p.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn('h-full rounded-full', TONES[i % TONES.length])}
                  style={{ width: `${Math.max(4, (p.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
