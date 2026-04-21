import type {
  ClassifiableRecord,
  ClassificationResult,
  RulesPayload,
} from "@/shared/types/rules.types"
import type { RiskTier } from "@/shared/types/onboarding.types"

const DEFAULT_HIGH_RISK_COUNTRIES = [
  "Iran",
  "North Korea",
  "Syria",
  "Myanmar",
  "Afghanistan",
]

export function classify(
  record: ClassifiableRecord,
  rules: RulesPayload | null
): ClassificationResult {
  const triggeredRules: string[] = []
  let highestTier: RiskTier = "LOW"

  const highRiskCountries =
    rules?.high_risk_countries ?? DEFAULT_HIGH_RISK_COUNTRIES

  // PEP status — always HIGH
  if (record.pep_status) {
    triggeredRules.push("PEP_STATUS")
    highestTier = "HIGH"
  }

  // Sanctions match — always HIGH
  if (record.sanctions_screening_match) {
    triggeredRules.push("SANCTIONS_MATCH")
    highestTier = "HIGH"
  }

  // Adverse media — at least MEDIUM
  if (record.adverse_media_flag) {
    triggeredRules.push("ADVERSE_MEDIA")
    if (highestTier === "LOW") highestTier = "MEDIUM"
  }

  // High-risk country — at least MEDIUM
  if (highRiskCountries.includes(record.country_of_tax_residence)) {
    triggeredRules.push("HIGH_RISK_COUNTRY")
    if (highestTier === "LOW") highestTier = "MEDIUM"
  }

  // High annual income entity — at least MEDIUM
  if (record.client_type === "ENTITY" && record.annual_income > 1_000_000) {
    triggeredRules.push("HIGH_INCOME_ENTITY")
    if (highestTier === "LOW") highestTier = "MEDIUM"
  }

  // Apply custom rules from rules payload
  if (rules?.rules) {
    for (const rule of rules.rules) {
      if (evaluateRule(rule.conditions, record)) {
        triggeredRules.push(rule.name)
        if (
          rule.tier === "HIGH" ||
          (rule.tier === "MEDIUM" && highestTier === "LOW")
        ) {
          highestTier = rule.tier
        }
      }
    }
  }

  return { tier: highestTier, triggered_rules: triggeredRules }
}

function evaluateRule(
  conditions: { field: string; operator: string; value: unknown }[],
  record: ClassifiableRecord
): boolean {
  return conditions.every((condition) => {
    const fieldValue = record[condition.field as keyof ClassifiableRecord]
    switch (condition.operator) {
      case "eq":
        return fieldValue === condition.value
      case "neq":
        return fieldValue !== condition.value
      case "gt":
        return (fieldValue as number) > (condition.value as number)
      case "gte":
        return (fieldValue as number) >= (condition.value as number)
      case "lt":
        return (fieldValue as number) < (condition.value as number)
      case "lte":
        return (fieldValue as number) <= (condition.value as number)
      case "in":
        return (condition.value as unknown[]).includes(fieldValue)
      case "contains":
        return String(fieldValue).includes(String(condition.value))
      default:
        return false
    }
  })
}
