export type Role = "RM" | "COMPLIANCE_OFFICER" | "AUDITOR"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  branch?: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}
