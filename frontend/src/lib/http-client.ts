import ky from "ky"
import { APIError } from "./errors"

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3101"

export const httpClient = ky.create({
  prefixUrl: API_BASE_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const authToken = localStorage.getItem("auth_token")
        if (authToken) {
          request.headers.set("X-Auth-Token", authToken)
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (!response.ok) {
          // Handle 401 Unauthorized globally
          if (response.status === 401) {
            // Clear auth data
            localStorage.removeItem("auth_token")
            localStorage.removeItem("username")
            
            // Redirect to login
            window.location.href = "/login"
          }
          
          throw await APIError.fromResponse(response)
        }
        return response
      },
    ],
  },
})
