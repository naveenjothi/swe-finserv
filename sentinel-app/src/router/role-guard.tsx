import { Navigate } from "react-router"
import { useAuthStore } from "@/stores/auth.store"
import type { Role } from "@/shared/types/auth.types"
import type { ReactNode } from "react"

export function RoleGuard({
  allowed,
  children,
}: {
  allowed: Role[]
  children: ReactNode
}) {
  const role = useAuthStore((s) => s.role)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
