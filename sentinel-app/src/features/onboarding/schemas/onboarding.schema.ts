import { z } from "zod"

export const onboardingSchema = z.object({
  client_name: z.string().min(2, "Min 2 characters").max(255),
  client_type: z.enum(["INDIVIDUAL", "ENTITY"]),
  pep_status: z.boolean(),
  sanctions_screening_match: z.boolean(),
  adverse_media_flag: z.boolean(),
  country_of_tax_residence: z.string().min(1, "Country is required").max(128),
  annual_income: z.number().min(0, "Must be zero or positive"),
  source_of_funds: z.string().min(1, "Required").max(128),
  declared_tier: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>
