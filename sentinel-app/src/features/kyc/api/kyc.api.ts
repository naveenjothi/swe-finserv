import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { components } from "@/shared/api/generated/sentinel-api.types"
import type { KycStatus } from "@/shared/types/onboarding.types"
import { clientKeys } from "@/features/onboarding/api/onboarding.api"

type PaginatedKycCaseView = components["schemas"]["PaginatedKycCaseView"]
type KycCaseView = components["schemas"]["KycCaseView"]
type TransitionKycRequest = components["schemas"]["TransitionKycRequest"]
type TransitionKycResponse = components["schemas"]["TransitionKycResponse"]

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
        .json<PaginatedKycCaseView>(),
  })
}

export function useUpdateKyc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransitionKycRequest }) =>
      api
        .patch(`kyc/${id}/status`, { json: data })
        .json<TransitionKycResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.all })
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
    },
  })
}
