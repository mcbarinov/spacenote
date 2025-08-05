import { HTTPError } from "ky"

import { httpClient } from "@/lib/http-client"
import type { Space, Note } from "@/types"

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

  // Spaces API
  async getSpaces(): Promise<Space[]> {
    return await httpClient.get("spaces").json<Space[]>()
  },

  async getSpace(spaceId: string): Promise<Space> {
    return await httpClient.get(`spaces/${spaceId}`).json<Space>()
  },

  async getSpaceNotes(spaceId: string): Promise<Note[]> {
    return await httpClient.get(`spaces/${spaceId}/notes`).json<Note[]>()
  },

  async getNote(noteId: string): Promise<Note> {
    return await httpClient.get(`notes/${noteId}`).json<Note>()
  },
}
