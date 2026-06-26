/** Mirrors the cradlen-api admin DTOs (the `data` payloads after unwrapping). */

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminMe {
  id: string;
  email: string;
  full_name: string;
}

export interface OrganizationListItem {
  id: string;
  name: string;
  status: string;
  branch_count: number;
  staff_count: number;
  enrolled_patients: number;
  subscription_status: string | null;
  plan: string | null;
  city: string | null;
  specialty: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  mrr: number | null;
  branch_limit: number | null;
  staff_limit: number | null;
  created_at: string;
}

export interface OrgOwner {
  full_name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
}

export interface OrgBilling {
  amount: number;
  currency: string;
  interval: 'MONTHLY' | 'YEARLY';
}

export interface OrgPlanLimits {
  max_branches: number;
  max_staff: number;
}

export interface OrgBranch {
  id: string;
  name: string;
  city: string;
  governorate: string;
  staff_count: number;
  is_main: boolean;
}

export interface OrgAddress {
  address: string;
  governorate: string;
  country: string | null;
}

export interface OrgActivity {
  type: string;
  title: string;
  body: string;
  created_at: string;
}

export interface OrgPortal {
  enrolled_patients: number;
  portal_accounts: number;
  active_accounts: number;
  activation_rate: number | null;
  active_this_month: number;
}

export interface OrganizationDetail extends OrganizationListItem {
  subscription_ends_at: string | null;
  trial_ends_at: string | null;
  owner: OrgOwner | null;
  billing: OrgBilling | null;
  plan_limits: OrgPlanLimits | null;
  branches: OrgBranch[];
  address: OrgAddress | null;
  recent_activity: OrgActivity[];
  portal: OrgPortal;
  add_ons: SubscriptionAddOn[];
}

export interface SubscriptionAddOn {
  name: string;
  kind: string;
  quantity: number;
  unit_amount: number | null;
  amount: number | null;
}

export interface SubscriptionListItem {
  id: string;
  organization_id: string;
  organization_name: string;
  plan: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  billing_interval: 'MONTHLY' | 'YEARLY' | null;
  amount: number | null;
  currency: string | null;
  mrr: number | null;
  add_on_count: number;
  add_ons: SubscriptionAddOn[];
}

export interface SubscriptionPlanOption {
  plan: string;
  max_branches: number;
  max_staff: number;
  amount: number | null;
  currency: string | null;
  billing_interval: 'MONTHLY' | 'YEARLY' | null;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  trial: number;
  expired: number;
  cancelled: number;
  mrr: number;
  currency: string;
  plan_distribution: PlanDistributionItem[];
}

export interface PaymentProof {
  id: string;
  url: string;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface PaymentListItem {
  id: string;
  organization_id: string;
  organization_name: string;
  purpose: string;
  plan: string;
  status: string;
  provider: string;
  reference: string | null;
  billing_interval: 'MONTHLY' | 'YEARLY';
  amount: string;
  currency: string;
  submitted_by_name: string | null;
  submitted_by_email: string | null;
  verified_by_id: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface PaymentItem {
  kind: 'PLAN' | 'ADD_ON';
  label: string;
  quantity: number;
  unit_amount: string;
  amount: string;
}

export interface PaymentDetail extends PaymentListItem {
  submitted_by_phone: string | null;
  verified_by_name: string | null;
  proofs: PaymentProof[];
  items: PaymentItem[];
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  before: unknown;
  after: unknown;
  created_at: string;
}

export interface PlanDistributionItem {
  plan: string;
  count: number;
}

export interface RevenuePoint {
  month: string; // 'YYYY-MM'
  amount: number;
}

export interface AdminMetricsOverview {
  organizations_total: number;
  organizations_added_this_month: number;
  active_subscriptions: number;
  awaiting_payments_total: number;
  currency: string;
  monthly_recurring_revenue: number;
  mrr_change_pct: number | null;
  revenue_history: RevenuePoint[];
  plan_distribution: PlanDistributionItem[];
  portal_accounts_total: number;
  enrolled_patients_total: number;
  portal_activation_rate: number | null;
}

export type AdminNotificationType =
  | 'ORGANIZATION_CREATED'
  | 'SUBSCRIPTION_STARTED'
  | 'PLAN_CHANGED'
  | 'PAYMENT_SUBMITTED';

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  organization_id: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PlatformSettings {
  instapay_handle: string | null;
  wallet_number: string | null;
  free_trial_days: number;
  auto_verify_gateway_payments: boolean;
  default_currency: string;
}

/** Mirrors the cradlen-api AdminResponseDto (status is derived, not a role). */
export type AdminAccountStatus = 'ACTIVE' | 'PENDING' | 'DISABLED';

export interface AdminTeamMember {
  id: string;
  email: string;
  full_name: string;
  status: AdminAccountStatus;
  created_at: string;
}
