import { cn } from '@/lib/cn';
import { dayShort } from '@/lib/format';
import type { AdminDailyMetricPoint } from '@/lib/types';

type Series = { active: number; total: number; date: string };

/**
 * Per-day engagement: active vs total, for staff and patient portals. Pure-CSS
 * bars (no charting lib), mirroring RevenueChart. Each column draws the day's
 * `total` as a faint track with the `active` portion filled solid on top, both
 * scaled to the window's peak total so the two series read on one axis.
 */
export function DailyTrendChart({ data }: { data: AdminDailyMetricPoint[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-brand-black">
            Daily engagement
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Active vs total · last {data.length} days
          </p>
        </div>
        <Legend />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendPanel
          label="Staff"
          series={data.map((p) => ({
            active: p.active_staff,
            total: p.total_staff,
            date: p.date,
          }))}
        />
        <TrendPanel
          label="Patient portals"
          series={data.map((p) => ({
            active: p.active_portals,
            total: p.total_portals,
            date: p.date,
          }))}
        />
      </div>
    </div>
  );
}

function TrendPanel({ label, series }: { label: string; series: Series[] }) {
  const max = Math.max(1, ...series.map((s) => s.total));
  const latest = series[series.length - 1];
  const active = latest?.active ?? 0;
  const total = latest?.total ?? 0;
  const ratio = total > 0 ? Math.round((active / total) * 100) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-brand-black">{label}</span>
        <span className="text-sm text-gray-500">
          <span className="font-semibold text-brand-black">{active}</span> /{' '}
          {total}
          {ratio !== null ? (
            <span className="ml-1 text-brand-primary">· {ratio}%</span>
          ) : null}
        </span>
      </div>

      <div className="mt-3 flex h-32 items-end gap-px">
        {series.map((s) => {
          const totalPct = Math.max(2, (s.total / max) * 100);
          const activePct = Math.max(0, (s.active / max) * 100);
          return (
            <div
              key={s.date}
              className="relative flex h-full flex-1 items-end"
              title={`${dayShort(s.date)} — ${s.active} active / ${s.total} total`}
            >
              <div
                className="w-full rounded-sm bg-brand-secondary/25"
                style={{ height: `${totalPct}%` }}
              />
              <div
                className="absolute bottom-0 w-full rounded-sm bg-brand-primary"
                style={{ height: `${activePct}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <span>{series[0] ? dayShort(series[0].date) : ''}</span>
        <span>{latest ? dayShort(latest.date) : ''}</span>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className={cn('size-2.5 rounded-sm', 'bg-brand-primary')} />
        Active
      </span>
      <span className="flex items-center gap-1.5">
        <span className={cn('size-2.5 rounded-sm', 'bg-brand-secondary/25')} />
        Total
      </span>
    </div>
  );
}
