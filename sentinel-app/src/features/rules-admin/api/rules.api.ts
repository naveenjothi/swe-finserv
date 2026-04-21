import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { RulesPayload, RulesVersionInfo } from "@/shared/types/rules.types"

export const rulesKeys = {
  all: ["rules"] as const,
  versions: () => [...rulesKeys.all, "versions"] as const,
  current: () => [...rulesKeys.all, "current"] as const,
}

export function useRulesVersions() {
  return useQuery({
    queryKey: rulesKeys.versions(),
    queryFn: () => api.get("rules/versions").json<RulesVersionInfo[]>(),
  })
}

export function useCurrentRules() {
  return useQuery({
    queryKey: rulesKeys.current(),
    queryFn: () => api.get("rules/current").json<RulesPayload>(),
  })
}

export function useUploadRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RulesPayload) =>
      api.post("rules", { json: payload }).json<RulesVersionInfo>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rulesKeys.all })
    },
  })
}
