import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { components } from "@/shared/api/generated/sentinel-api.types"
import type {
  ClientFilters,
  CreateOnboardingDto,
} from "@/shared/types/onboarding.types"

type PaginatedClientView = components["schemas"]["PaginatedClientView"]
type ClientDetailView = components["schemas"]["ClientDetailView"]
type SubmitOnboardingResponse =
  components["schemas"]["SubmitOnboardingResponse"]
type ImportCsvResponse = components["schemas"]["ImportCsvResponse"]

export const clientKeys = {
  all: ["clients"] as const,
  list: (filters: ClientFilters) =>
    [...clientKeys.all, "list", filters] as const,
  detail: (id: string) => [...clientKeys.all, "detail", id] as const,
}

export function useClients(filters: ClientFilters) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () =>
      api
        .get("clients", { searchParams: filters as Record<string, string> })
        .json<PaginatedClientView>(),
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => api.get(`clients/${id}`).json<ClientDetailView>(),
    enabled: !!id,
  })
}

export function useSubmitOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOnboardingDto) =>
      api.post("onboarding", { json: data }).json<SubmitOnboardingResponse>(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  })
}

export function useSubmitCorrection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      clientId: _clientId,
      data,
      reason: _reason,
    }: {
      clientId: string
      data: CreateOnboardingDto
      reason: string
    }) =>
      api.post("onboarding", { json: data }).json<SubmitOnboardingResponse>(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.clientId),
      })
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
    },
  })
}

export function useImportCsv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return api
        .post("onboarding/import", { body: formData })
        .json<ImportCsvResponse>()
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  })
}
