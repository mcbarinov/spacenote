import ky from "ky"
import { useAuthStore } from "../../stores/authStore"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

export const api = ky.create({
  prefixUrl: API_URL,
  hooks: {
    beforeRequest: [
      request => {
        const sessionId = useAuthStore.getState().sessionId
        if (sessionId) {
          request.headers.set("X-Session-ID", sessionId)
        }
      },
    ],
  },
})

// Re-export all APIs
export * from "./auth"
export * from "./comments"
export * from "./notes"
export * from "./spaces"
export * from "./users"
