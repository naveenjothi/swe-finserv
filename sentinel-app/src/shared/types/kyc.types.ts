import type { KycStatus } from "./onboarding.types"

export interface KycRecord {
  id: string
  client_id: string
  client_name: string
  kyc_status: KycStatus
  previous_status: KycStatus | null
  updated_by: string
  updated_at: string
  reason?: string
  requires_edd: boolean
}

export interface UpdateKycDto {
  client_id: string
  kyc_status: KycStatus
  reason: string
}
