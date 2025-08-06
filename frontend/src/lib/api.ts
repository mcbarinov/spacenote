import { httpClient } from "@/lib/http-client"
import type { Space, Note, SpaceField, PaginationResult } from "@/types"

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  session_id: string
  user_id: string
}

export interface CreateSpaceRequest {
  id: string
  name: string
}

export const api = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return await httpClient.post("auth/login", { json: credentials }).json<AuthResponse>()
  },

  async logout(): Promise<void> {
    await httpClient.post("auth/logout")
  },

  // Spaces API
  async getSpaces(): Promise<Space[]> {
    return await httpClient.get("spaces").json<Space[]>()
  },

  async createSpace(request: CreateSpaceRequest): Promise<Space> {
    return await httpClient.post("spaces", { json: request }).json<Space>()
  },

  async getSpaceNotes(spaceId: string): Promise<PaginationResult> {
    return await httpClient.get("notes", { searchParams: { space_id: spaceId } }).json<PaginationResult>()
  },

  async getNote(noteId: string, spaceId: string): Promise<Note> {
    return await httpClient.get(`notes/${noteId}`, { searchParams: { space_id: spaceId } }).json<Note>()
  },

  async createNote(spaceId: string, fields: Record<string, string>): Promise<Note> {
    return await httpClient
      .post("notes", {
        json: fields,
        searchParams: { space_id: spaceId },
      })
      .json<Note>()
  },

  async createField(spaceId: string, field: SpaceField): Promise<void> {
    await httpClient.post(`spaces/${spaceId}/fields`, { json: field })
  },

  async updateListFields(spaceId: string, listFields: string[]): Promise<void> {
    await httpClient.put(`spaces/${spaceId}/list-fields`, { json: { field_names: listFields } })
  },

  async updateHiddenCreateFields(spaceId: string, hiddenCreateFields: string[]): Promise<void> {
    await httpClient.put(`spaces/${spaceId}/hidden-create-fields`, { json: { field_names: hiddenCreateFields } })
  },
}
