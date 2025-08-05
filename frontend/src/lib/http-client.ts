import ky, { HTTPError } from "ky"

import { getStoredSessionId, clearAuthData } from "@/lib/auth-storage"
import { APIError, type APIErrorResponse } from "@/lib/api-error"

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
      async (_request, _options, response) => {
        if (response.status === 401) {
          clearAuthData()
          window.dispatchEvent(new CustomEvent("auth:logout"))
        }

        if (!response.ok) {
          try {
            const errorData = (await response.json()) as APIErrorResponse
            throw new APIError(errorData)
          } catch (error) {
            if (error instanceof APIError) {
              throw error
            }
            throw new HTTPError(response, _request, _options)
          }
        }

        return response
      },
    ],
  },
})
