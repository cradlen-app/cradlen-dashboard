/** Small presentation helpers shared by the dashboard cards and lists. */

/** `45360` → `EGP 45.4K`; `980` → `EGP 980`. */
export function formatCurrencyShort(
  amount: number,
  currency = 'EGP',
): string {
  const abs = Math.abs(amount);
  let body: string;
  if (abs >= 1_000_000) body = `${trim(amount / 1_000_000)}M`;
  else if (abs >= 1_000) body = `${trim(amount / 1_000)}K`;
  else body = trim(amount);
  return `${currency} ${body}`;
}

/** `45360` → `45,360` (full, grouped). */
export function formatCurrencyFull(amount: number, currency = 'EGP'): string {
  return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
}

function trim(n: number): string {
  // One decimal place, but drop a trailing `.0`.
  return (Math.round(n * 10) / 10).toString();
}

/** Relative time: "just now", "2 hours ago", "Yesterday", "3 days ago". */
export function timeAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

/** First letters of the first two words, uppercased: "BrightSmile Clinic" → "BC". */
export function initials(name: string | null | undefined): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** `'2026-06'` → `Jun`. */
export function monthShort(isoMonth: string): string {
  const m = Number(isoMonth.split('-')[1]);
  return MONTHS[m - 1] ?? isoMonth;
}

/** `'2026-06-12T...'` → `Jun 2026`. */
export function monthYear(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
