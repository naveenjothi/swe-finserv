import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { KycRecord, UpdateKycDto } from "@/shared/types/kyc.types"
import type {
  PaginatedResponse,
  KycStatus,
} from "@/shared/types/onboarding.types"
import { clientKeys } from "@/features/onboarding/api/onboarding.api"

export const kycKeys = {
  all: ["kyc"] as const,
  list: (filters: { page?: number; status?: KycStatus }) =>
    [...kycKeys.all, "list", filters] as const,
}

export function useKycQueue(filters: { page?: number; status?: KycStatus }) {
  return useQuery({
    queryKey: kycKeys.list(filters),
    queryFn: () =>
      api
        .get("kyc", { searchParams: filters as Record<string, string> })
        .json<PaginatedResponse<KycRecord>>(),
  })
}

export function useUpdateKyc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateKycDto) =>
      api.put(`kyc/${data.client_id}`, { json: data }).json<KycRecord>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.all })
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
    },
  })
}
