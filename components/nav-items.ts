import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CreditCard,
  LayoutGrid,
  ReceiptText,
  ScrollText,
  Settings,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
};

export const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Overview',
    items: [{ href: '/', label: 'Overview', icon: LayoutGrid }],
  },
  {
    heading: 'Management',
    items: [
      { href: '/organizations', label: 'Organizations', icon: Building2 },
      { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { href: '/payments', label: 'Payments', icon: ReceiptText, badge: true },
    ],
  },
  {
    heading: 'Activity',
    items: [{ href: '/audit-log', label: 'Audit log', icon: ScrollText }],
  },
];

export const SETTINGS_ITEM: NavItem = {
  href: '/settings',
  label: 'Settings',
  icon: Settings,
};

/** Flattened nav in display order — used by the mobile bottom bar / more sheet. */
export const NAV_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  SETTINGS_ITEM,
];

/** Hrefs shown directly in the mobile bottom bar; the rest go to the More sheet. */
export const PRIMARY_TAB_HREFS = [
  '/',
  '/organizations',
  '/subscriptions',
  '/payments',
] as const;

/** Shared active-route convention. */
export function isNavActive(href: string, pathname: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
