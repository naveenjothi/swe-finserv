import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Role, LoginDto } from "@/shared/types/auth.types"

const DEFAULT_USER: User = {
  id: "dev-user",
  name: "SENTINEL User",
  email: "user@sentinel.local",
  role: "RM",
  branch: "LONDON",
}

const DEFAULT_ROLE: Role = "RM"

interface AuthState {
  user: User | null
  role: Role | null
  token: string | null
  switchRole: (role: Role) => void
  login: (credentials: LoginDto) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: DEFAULT_USER,
      role: DEFAULT_ROLE,
      token: DEFAULT_ROLE,

      switchRole: (role: Role) => {
        set((state) => {
          if (
            state.role === role &&
            state.token === role &&
            state.user?.role === role
          ) {
            return state
          }

          return {
            role,
            token: role,
            user: state.user
              ? { ...state.user, role }
              : { ...DEFAULT_USER, role },
          }
        })
      },

      login: async (_credentials: LoginDto) => {
        set({
          user: DEFAULT_USER,
          role: DEFAULT_ROLE,
          token: DEFAULT_ROLE,
        })
      },

      logout: () => {
        set({ user: DEFAULT_USER, role: DEFAULT_ROLE, token: DEFAULT_ROLE })
      },

      isAuthenticated: () => get().role !== null,
    }),
    {
      name: "sentinel_auth",
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState> | undefined
        const role = persisted?.role ?? currentState.role ?? DEFAULT_ROLE
        const user = persisted?.user
          ? { ...persisted.user, role }
          : { ...DEFAULT_USER, role }
        const token = persisted?.token ?? role

        return {
          ...currentState,
          ...persisted,
          role,
          user,
          token,
        }
      },
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        token: state.token,
      }),
    }
  )
)
