import { useRulesStore } from "@/stores/rules.store"
import { classify } from "@/shared/lib/rules-engine"
import type { ClassificationResult } from "@/shared/types/rules.types"
import type { CreateOnboardingDto } from "@/shared/types/onboarding.types"

export function useClassification(
  formValues: Partial<CreateOnboardingDto>
): ClassificationResult {
  const payload = useRulesStore((s) => s.payload)

  return classify(
    {
      pep_status: formValues.pep_status ?? false,
      sanctions_screening_match: formValues.sanctions_screening_match ?? false,
      adverse_media_flag: formValues.adverse_media_flag ?? false,
      country_of_tax_residence: formValues.country_of_tax_residence ?? "",
      client_type: formValues.client_type ?? "INDIVIDUAL",
      annual_income: formValues.annual_income ?? 0,
      source_of_funds: formValues.source_of_funds ?? "Employment",
    },
    payload
  )
}
