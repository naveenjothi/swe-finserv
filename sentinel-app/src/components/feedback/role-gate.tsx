import { useAuthStore } from "@/stores/auth.store"
import type { Role } from "@/shared/types/auth.types"
import type { ReactNode } from "react"

export function RoleGate({
  allowed,
  children,
}: {
  allowed: Role[]
  children: ReactNode
}) {
  const role = useAuthStore((s) => s.role)
  if (!role || !allowed.includes(role)) return null
  return <>{children}</>
}
