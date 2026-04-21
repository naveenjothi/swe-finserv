import ky from "ky"
import { useAuthStore } from "@/stores/auth.store"

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().token
        const role = useAuthStore.getState().role
        const user = useAuthStore.getState().user

        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }

        if (role) {
          request.headers.set("x-user-role", role)
        }

        if (user?.id) {
          request.headers.set("x-user-id", user.id)
        }

        if (user?.name) {
          request.headers.set("x-user-name", user.name)
        }
      },
    ],
  },
  retry: { limit: 2, methods: ["get"] },
  timeout: 10_000,
})
