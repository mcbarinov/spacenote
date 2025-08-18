import { httpClient } from "./http-client"
import type { LoginRequest, LoginResponse, Space, CreateSpaceRequest } from "../types"

export const api = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return await httpClient.post("api/auth/login", { json: credentials }).json<LoginResponse>()
  },

  async logout(): Promise<void> {
    try {
      await httpClient.post("api/auth/logout")
    } catch {
      // Ignore logout errors
    }
  },

  async getCurrentUser() {
    return await httpClient.get("api/auth/me").json()
  },

  // Spaces API
  async getSpaces(): Promise<Space[]> {
    return await httpClient.get("api/spaces").json<Space[]>()
  },

  async createSpace(data: CreateSpaceRequest): Promise<Space> {
    return await httpClient.post("api/spaces", { json: data }).json<Space>()
  },
}
