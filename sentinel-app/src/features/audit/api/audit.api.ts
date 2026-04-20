import { useQuery } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { AuditEntry, AuditFilters } from "@/shared/types/audit.types"
import type { PaginatedResponse } from "@/shared/types/onboarding.types"

export const auditKeys = {
  all: ["audit"] as const,
  list: (filters: AuditFilters) => [...auditKeys.all, "list", filters] as const,
}

export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () =>
      api
        .get("audit", { searchParams: filters as Record<string, string> })
        .json<PaginatedResponse<AuditEntry>>(),
  })
}
