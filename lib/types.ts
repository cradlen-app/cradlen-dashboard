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
  subscription_status: string | null;
  plan: string | null;
  created_at: string;
}

export interface OrganizationDetail extends OrganizationListItem {
  subscription_ends_at: string | null;
  trial_ends_at: string | null;
}

export interface UserProfile {
  profile_id: string;
  organization_id: string;
  organization_name: string;
  role: string | null;
  is_active: boolean;
}

export interface UserListItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  is_active: boolean;
  profile_count: number;
  profiles: UserProfile[];
  created_at: string;
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
  amount: string;
  currency: string;
  verified_by_id: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface PaymentDetail extends PaymentListItem {
  proofs: PaymentProof[];
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
