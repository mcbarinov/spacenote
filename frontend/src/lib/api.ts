import { httpClient } from "./http-client"
import type { LoginRequest, LoginResponse } from "../types"

export const api = {
  auth: {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
      return httpClient.post("api/auth/login", { json: credentials }).json()
    },

    async logout(): Promise<void> {
      try {
        await httpClient.post("api/auth/logout")
      } catch {
        // Ignore logout errors
      }
    },

    async getCurrentUser() {
      return httpClient.get("api/auth/me").json()
    },
  },
}
