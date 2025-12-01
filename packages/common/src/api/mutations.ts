import { useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "./httpClient"
import type {
  Attachment,
  Comment,
  CreateCommentRequest,
  CreateNoteRequest,
  CreateSpaceRequest,
  CreateUserRequest,
  Filter,
  LoginRequest,
  Note,
  PendingAttachment,
  Space,
  SpaceField,
  UpdateDescriptionRequest,
  UpdateHiddenFieldsOnCreateRequest,
  UpdateMembersRequest,
  UpdateNotesListDefaultColumnsRequest,
  UpdateTitleRequest,
  User,
} from "../types"

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: LoginRequest) => httpClient.post("api/v1/auth/login", { json: credentials }),
    onSuccess: async () => {
      // Cookie is set automatically by the server
      // Invalidate and refetch all queries after login
      await queryClient.invalidateQueries()
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: () => httpClient.post("api/v1/auth/logout"),
    onSuccess: () => {
      // Cookie is cleared automatically by the server
      // NOTE: We don't clear the queryClient cache here because:
      // 1. Navigation to /login happens immediately in the component's onSuccess
      // 2. Protected data is not used on the login page
      // 3. Fresh data will be loaded by _auth.beforeLoad on next login
      // 4. Clearing cache here causes race condition: Header re-renders and tries
      //    to fetch currentUser, gets 401, triggers unnecessary error handling
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserRequest) => httpClient.post("api/v1/users", { json: data }).json<User>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => httpClient.delete(`api/v1/users/${username}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useCreateSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSpaceRequest) => httpClient.post("api/v1/spaces", { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useDeleteSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slug: string) => httpClient.delete(`api/v1/spaces/${slug}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useUpdateSpaceTitle(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateTitleRequest) => httpClient.patch(`api/v1/spaces/${slug}/title`, { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useUpdateSpaceDescription(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateDescriptionRequest) =>
      httpClient.patch(`api/v1/spaces/${slug}/description`, { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useUpdateSpaceHiddenFieldsOnCreate(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateHiddenFieldsOnCreateRequest) =>
      httpClient.patch(`api/v1/spaces/${slug}/hidden-fields-on-create`, { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useUpdateSpaceNotesListDefaultColumns(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateNotesListDefaultColumnsRequest) =>
      httpClient.patch(`api/v1/spaces/${slug}/notes-list-default-columns`, { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useUpdateSpaceMembers(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateMembersRequest) => httpClient.patch(`api/v1/spaces/${slug}/members`, { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useAddField(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (field: SpaceField) => httpClient.post(`api/v1/spaces/${spaceSlug}/fields`, { json: field }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useDeleteField(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fieldName: string) => httpClient.delete(`api/v1/spaces/${spaceSlug}/fields/${fieldName}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useAddFilter(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: Filter) => httpClient.post(`api/v1/spaces/${spaceSlug}/filters`, { json: filter }).json<Filter>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useDeleteFilter(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filterName: string) => httpClient.delete(`api/v1/spaces/${spaceSlug}/filters/${filterName}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useCreateNote(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateNoteRequest) => httpClient.post(`api/v1/spaces/${spaceSlug}/notes`, { json: data }).json<Note>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces", spaceSlug, "notes"] })
    },
  })
}

export function useCreateComment(spaceSlug: string, noteNumber: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCommentRequest) =>
      httpClient.post(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}/comments`, { json: data }).json<Comment>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces", spaceSlug, "notes", noteNumber, "comments"] })
    },
  })
}

export function useUploadSpaceAttachment(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return httpClient.post(`api/v1/spaces/${spaceSlug}/attachments`, { body: formData }).json<Attachment>()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces", spaceSlug, "attachments"] })
    },
  })
}

export function useUploadNoteAttachment(spaceSlug: string, noteNumber: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return httpClient
        .post(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}/attachments`, { body: formData })
        .json<Attachment>()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces", spaceSlug, "notes", noteNumber, "attachments"] })
    },
  })
}

export function useUploadPendingAttachment() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return httpClient.post("api/v1/attachments/pending", { body: formData }).json<PendingAttachment>()
    },
  })
}
