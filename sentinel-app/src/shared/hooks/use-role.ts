import { useAuthStore } from "@/stores/auth.store"
import type { Role } from "@/shared/types/auth.types"

export function useRole(): Role | null {
  return useAuthStore((s) => s.role)
}
