import type { Role } from "../types/auth.types"

export const ROLES = {
  RM: "RM" as Role,
  COMPLIANCE_OFFICER: "COMPLIANCE_OFFICER" as Role,
  AUDITOR: "AUDITOR" as Role,
} as const

export const ROLE_LABELS: Record<Role, string> = {
  RM: "Relationship Manager",
  COMPLIANCE_OFFICER: "Compliance Officer",
  AUDITOR: "Auditor",
}
