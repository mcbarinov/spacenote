import ky from "ky"

import { getStoredSessionId, clearAuthData } from "@/lib/auth-storage"

export const httpClient = ky.create({
  prefixUrl: "/api",
  hooks: {
    beforeRequest: [
      (request) => {
        const sessionId = getStoredSessionId()
        if (sessionId) {
          request.headers.set("X-Session-Id", sessionId)
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          clearAuthData()
          window.dispatchEvent(new CustomEvent("auth:logout"))
        }
        return response
      },
    ],
  },
})
