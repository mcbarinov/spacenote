import { httpClient } from "./http-client"
import type { LoginRequest, LoginResponse, Space, CreateSpaceRequest, AddFieldRequest, Note, CreateNoteRequest } from "../types"

export const api = {
  // Auth API
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return await httpClient.post("api/auth/login", { json: credentials }).json<LoginResponse>()
  },

  async logout(): Promise<void> {
    await httpClient.post("api/auth/logout")
  },

  // Spaces API
  async getSpaces(): Promise<Space[]> {
    return await httpClient.get("api/spaces").json<Space[]>()
  },

  async createSpace(data: CreateSpaceRequest): Promise<Space> {
    return await httpClient.post("api/spaces", { json: data }).json<Space>()
  },

  async addFieldToSpace(spaceSlug: string, data: AddFieldRequest): Promise<Space> {
    return await httpClient.post(`api/spaces/${spaceSlug}/fields`, { json: data }).json<Space>()
  },

  // Notes API
  async getNotesBySpace(spaceSlug: string): Promise<Note[]> {
    return await httpClient.get(`api/spaces/${spaceSlug}/notes`).json<Note[]>()
  },

  async createNote(spaceSlug: string, data: CreateNoteRequest): Promise<Note> {
    return await httpClient.post(`api/spaces/${spaceSlug}/notes`, { json: data }).json<Note>()
  },
}
