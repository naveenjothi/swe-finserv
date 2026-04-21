export type AuditAction =
  | "ONBOARDING_CREATED"
  | "ONBOARDING_UPDATED"
  | "KYC_STATUS_CHANGED"
  | "RISK_RECLASSIFIED"
  | "RULES_VERSION_UPDATED"
  | "CORRECTION_SUBMITTED"

export interface AuditEntry {
  id: string
  entity_type: string
  entity_id: string
  action: AuditAction
  actor: string
  actor_role: string
  timestamp: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}

export interface AuditFilters {
  page?: number
  pageSize?: number
  entity_id?: string
  action?: AuditAction
  actor?: string
  from_date?: string
  to_date?: string
}
