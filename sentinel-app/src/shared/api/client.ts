import ky from "ky"
import { useAuthStore } from "@/stores/auth.store"

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().token
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }
      },
    ],
  },
  retry: { limit: 2, methods: ["get"] },
  timeout: 10_000,
})
