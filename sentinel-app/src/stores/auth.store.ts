import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Role, LoginDto } from "@/shared/types/auth.types"
import { api } from "@/shared/api/client"

interface AuthState {
  user: User | null
  role: Role | null
  token: string | null
  login: (credentials: LoginDto) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      token: null,

      login: async (credentials: LoginDto) => {
        const response = await api
          .post("auth/login", { json: credentials })
          .json<{ user: User; token: string }>()

        set({
          user: response.user,
          role: response.user.role,
          token: response.token,
        })
      },

      logout: () => {
        set({ user: null, role: null, token: null })
      },

      isAuthenticated: () => get().token !== null,
    }),
    {
      name: "sentinel_auth",
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        token: state.token,
      }),
    }
  )
)
