import createClient from "openapi-fetch"
import type { paths } from "./sentinel-api.types"
import { useAuthStore } from "@/stores/auth.store"

export const typedApi = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
})

typedApi.use({
  async onRequest({ request }) {
    const { token, role, user } = useAuthStore.getState()

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

    return request
  },
})
