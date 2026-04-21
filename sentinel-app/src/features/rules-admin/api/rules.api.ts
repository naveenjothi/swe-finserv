import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { components } from "@/shared/api/generated/sentinel-api.types"

type RulesVersionInfoView = components["schemas"]["RulesVersionInfoView"]
type ActiveRulesView = components["schemas"]["ActiveRulesView"]
type PublishRuleSetRequest = components["schemas"]["PublishRuleSetRequest"]
type PublishRuleSetResponse = components["schemas"]["PublishRuleSetResponse"]

export const rulesKeys = {
  all: ["rules"] as const,
  versions: () => [...rulesKeys.all, "versions"] as const,
  current: () => [...rulesKeys.all, "current"] as const,
}

export function useRulesVersions() {
  return useQuery({
    queryKey: rulesKeys.versions(),
    queryFn: () => api.get("rules/versions").json<RulesVersionInfoView[]>(),
  })
}

export function useCurrentRules() {
  return useQuery({
    queryKey: rulesKeys.current(),
    queryFn: () => api.get("rules/active").json<ActiveRulesView>(),
  })
}

export function useUploadRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PublishRuleSetRequest) =>
      api.post("rules", { json: payload }).json<PublishRuleSetResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rulesKeys.all })
    },
  })
}
