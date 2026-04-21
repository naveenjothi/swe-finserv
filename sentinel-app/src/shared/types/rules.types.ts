import type { RiskTier } from "./onboarding.types"

export interface RuleCondition {
  field: string
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains"
  value: unknown
}

export interface Rule {
  id: string
  name: string
  description: string
  conditions: RuleCondition[]
  tier: RiskTier
  priority: number
}

export interface RulesPayload {
  version: string
  valid_from: string
  rules: Rule[]
  high_risk_countries: string[]
}

export interface RulesVersionInfo {
  version: string
  valid_from: string
  created_at: string
  created_by: string
}

export interface ClassifiableRecord {
  pep_status: boolean
  sanctions_screening_match: boolean
  adverse_media_flag: boolean
  country_of_tax_residence: string
  client_type: string
  annual_income: number
  source_of_funds: string
}

export interface ClassificationResult {
  tier: RiskTier
  triggered_rules: string[]
}
