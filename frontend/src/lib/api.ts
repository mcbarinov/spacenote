import { httpClient } from "./http-client"
import type {
  LoginRequest,
  LoginResponse,
  User,
  Space,
  CreateSpaceRequest,
  CreateUserRequest,
  SpaceField,
  Note,
  CreateNoteRequest,
  Comment,
  CreateCommentRequest,
} from "../types"

export const api = {
  // Auth API
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return await httpClient.post("api/v1/auth/login", { json: credentials }).json<LoginResponse>()
  },

  async logout(): Promise<void> {
    await httpClient.post("api/v1/auth/logout")
  },

  async getCurrentUser(): Promise<User> {
    return await httpClient.get("api/v1/users/me").json<User>()
  },

  // Users API
  async getUsers(): Promise<User[]> {
    return await httpClient.get("api/v1/users").json<User[]>()
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    return await httpClient.post("api/v1/users", { json: data }).json<User>()
  },

  // Spaces API
  async getSpaces(): Promise<Space[]> {
    return await httpClient.get("api/v1/spaces").json<Space[]>()
  },

  async createSpace(data: CreateSpaceRequest): Promise<Space> {
    return await httpClient.post("api/v1/spaces", { json: data }).json<Space>()
  },

  async addFieldToSpace(spaceSlug: string, data: SpaceField): Promise<Space> {
    return await httpClient.post(`api/v1/spaces/${spaceSlug}/fields`, { json: data }).json<Space>()
  },

  async updateSpaceMembers(spaceSlug: string, usernames: string[]): Promise<Space> {
    return await httpClient.put(`api/v1/spaces/${spaceSlug}/members`, { json: { usernames } }).json<Space>()
  },

  // Notes API
  async getNotesBySpace(spaceSlug: string): Promise<Note[]> {
    return await httpClient.get(`api/v1/spaces/${spaceSlug}/notes`).json<Note[]>()
  },

  async getNote(spaceSlug: string, number: number): Promise<Note> {
    return await httpClient.get(`api/v1/spaces/${spaceSlug}/notes/${String(number)}`).json<Note>()
  },

  async createNote(spaceSlug: string, data: CreateNoteRequest): Promise<Note> {
    return await httpClient.post(`api/v1/spaces/${spaceSlug}/notes`, { json: data }).json<Note>()
  },

  // Comments API
  async getNoteComments(spaceSlug: string, noteNumber: number): Promise<Comment[]> {
    return await httpClient.get(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}/comments`).json<Comment[]>()
  },

  async createComment(spaceSlug: string, noteNumber: number, data: CreateCommentRequest): Promise<Comment> {
    return await httpClient
      .post(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}/comments`, { json: data })
      .json<Comment>()
  },

  // Space settings API
  async updateSpaceTitle(spaceSlug: string, title: string): Promise<Space> {
    return await httpClient.patch(`api/v1/spaces/${spaceSlug}/title`, { json: { title } }).json<Space>()
  },

  async updateSpaceListFields(spaceSlug: string, listFields: string[]): Promise<Space> {
    return await httpClient.patch(`api/v1/spaces/${spaceSlug}/list-fields`, { json: { list_fields: listFields } }).json<Space>()
  },

  async updateSpaceHiddenCreateFields(spaceSlug: string, hiddenCreateFields: string[]): Promise<Space> {
    return await httpClient
      .patch(`api/v1/spaces/${spaceSlug}/hidden-create-fields`, {
        json: { hidden_create_fields: hiddenCreateFields },
      })
      .json<Space>()
  },
}
