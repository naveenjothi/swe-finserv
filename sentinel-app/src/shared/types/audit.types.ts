export type AuditAction =
  | "ONBOARDING_CREATED"
  | "ONBOARDING_UPDATED"
  | "KYC_STATUS_CHANGED"
  | "RISK_RECLASSIFIED"
  | "RULES_VERSION_UPDATED"
  | "CORRECTION_SUBMITTED"

export interface AuditEntry {
  id: string
  aggregate_id: string
  aggregate_type: string
  event_type: string
  payload: Record<string, unknown>
  performed_by: string
  created_at: string
}

export interface AuditFilters {
  page?: number
  pageSize?: number
  aggregate_id?: string
  event_type?: string
  performed_by?: string
  from_date?: string
  to_date?: string
}
