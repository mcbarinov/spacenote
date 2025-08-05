import { HTTPError } from "ky"

import { httpClient } from "@/lib/http-client"

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  session_id: string
  user_id: string
}

export const api = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      return await httpClient.post("auth/login", { json: credentials }).json<AuthResponse>()
    } catch (error) {
      if (error instanceof HTTPError && error.response.status === 401) {
        throw new Error("Invalid username or password")
      }
      throw new Error("Login failed. Please try again.")
    }
  },

  async logout(): Promise<void> {
    await httpClient.post("auth/logout")
  },
}
