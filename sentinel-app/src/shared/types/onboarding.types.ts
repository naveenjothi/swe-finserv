export type ClientType = "INDIVIDUAL" | "ENTITY"

export type SourceOfFunds =
  | "Employment"
  | "Business Income"
  | "Investment Returns"
  | "Inheritance"
  | "Property Sale"
  | "Pension"
  | "Gift"
  | "Other"

export type KycStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "ENHANCED_DUE_DILIGENCE"

export type RiskTier = "HIGH" | "MEDIUM" | "LOW"

/** GET /api/clients — list view */
export interface ClientListItem {
  id: string
  client_name: string
  client_type: ClientType
  computed_tier: RiskTier
  requires_edd: boolean
  mismatch: boolean
  rules_version: string
  submitted_by: string
  created_at: string
}

/** GET /api/clients/:id — detail view */
export interface ClientDetail {
  id: string
  client_name: string
  client_type: ClientType
  pep_status: boolean
  sanctions_screening_match: boolean
  adverse_media_flag: boolean
  country_of_tax_residence: string
  annual_income: number
  source_of_funds: string
  computed_tier: RiskTier
  triggered_rules: Array<{ tier: string; code: string; description: string }>
  requires_edd: boolean
  rules_version: string
  declared_tier: RiskTier | null
  mismatch: boolean
  submitted_by: string
  created_at: string
}

/** POST /api/onboarding */
export interface CreateOnboardingDto {
  client_name: string
  client_type: ClientType
  pep_status: boolean
  sanctions_screening_match: boolean
  adverse_media_flag: boolean
  country_of_tax_residence: string
  annual_income: number
  source_of_funds: string
  declared_tier?: RiskTier
}

/** POST /api/onboarding response */
export interface OnboardingResponse {
  id: string
  client_name: string
  computed_tier: RiskTier
  declared_tier: RiskTier | null
  mismatch: boolean
  requires_edd: boolean
  rules_version: string
  triggered_rules: Array<{ tier: string; code: string; description: string }>
}

export interface ImportCsvRow {
  row: number
  client_name: string
  computed_tier: RiskTier
  declared_tier?: RiskTier
  mismatch: boolean
  id: string
}

export interface ImportCsvResponse {
  total_imported: number
  mismatches: number
  rows: ImportCsvRow[]
}

export interface ClientFilters {
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
