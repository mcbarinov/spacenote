import { useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "./httpClient"
import type {
  Attachment,
  Comment,
  CreateCommentRequest,
  CreateNoteRequest,
  CreateSpaceRequest,
  CreateUserRequest,
  ExportData,
  Filter,
  LoginRequest,
  Note,
  PendingAttachment,
  SetTemplateRequest,
  Space,
  SpaceField,
  UpdateDefaultFilterRequest,
  UpdateDescriptionRequest,
  UpdateEditableFieldsOnCommentRequest,
  UpdateFieldRequest,
  UpdateHiddenFieldsOnCreateRequest,
  UpdateMembersRequest,
  UpdateNoteRequest,
  UpdateTelegramRequest,
  UpdateTitleRequest,
  User,
} from "../types"

/** Authenticates user with credentials */
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

/** Logs out current user */
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

/** Creates a new user (admin only) */
export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserRequest) => httpClient.post("api/v1/users", { json: data }).json<User>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

/** Deletes a user (admin only) */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => httpClient.delete(`api/v1/users/${username}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

/** Sets password for a user (admin only) */
export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      httpClient.put(`api/v1/users/${username}/password`, { json: { password } }),
  })
}

/** Creates a new space */
export function useCreateSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSpaceRequest) => httpClient.post("api/v1/spaces", { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Imports a space from JSON export */
export function useImportSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ExportData) => httpClient.post("api/v1/spaces/import", { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Deletes a space */
export function useDeleteSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slug: string) => httpClient.delete(`api/v1/spaces/${slug}`),
    // Fire-and-forget: don't await to allow navigation before re-render
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Updates space title */
export function useUpdateSpaceTitle(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateTitleRequest) => httpClient.patch(`api/v1/spaces/${slug}/title`, { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Updates space description */
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

/** Updates hidden fields on note create form */
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

/** Updates editable fields on comment */
export function useUpdateSpaceEditableFieldsOnComment(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateEditableFieldsOnCommentRequest) =>
      httpClient.patch(`api/v1/spaces/${slug}/editable-fields-on-comment`, { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Updates space members */
export function useUpdateSpaceMembers(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateMembersRequest) => httpClient.patch(`api/v1/spaces/${slug}/members`, { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Adds a field to space schema */
export function useAddField(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (field: SpaceField) => httpClient.post(`api/v1/spaces/${spaceSlug}/fields`, { json: field }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Deletes a field from space schema */
export function useDeleteField(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fieldName: string) => httpClient.delete(`api/v1/spaces/${spaceSlug}/fields/${fieldName}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Updates a field in space schema */
export function useUpdateField(spaceSlug: string, fieldName: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateFieldRequest) =>
      httpClient.put(`api/v1/spaces/${spaceSlug}/fields/${fieldName}`, { json: data }).json<SpaceField>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Adds a filter to space */
export function useAddFilter(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: Filter) => httpClient.post(`api/v1/spaces/${spaceSlug}/filters`, { json: filter }).json<Filter>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Updates a filter in space */
export function useUpdateFilter(spaceSlug: string, filterName: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: Filter) =>
      httpClient.put(`api/v1/spaces/${spaceSlug}/filters/${filterName}`, { json: filter }).json<Filter>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Deletes a filter from space */
export function useDeleteFilter(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filterName: string) => httpClient.delete(`api/v1/spaces/${spaceSlug}/filters/${filterName}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Creates a new note in space */
export function useCreateNote(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateNoteRequest) => httpClient.post(`api/v1/spaces/${spaceSlug}/notes`, { json: data }).json<Note>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces", spaceSlug, "notes"] })
    },
  })
}

/** Updates an existing note */
export function useUpdateNote(spaceSlug: string, noteNumber: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateNoteRequest) =>
      httpClient.patch(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}`, { json: data }).json<Note>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces", spaceSlug, "notes"] })
    },
  })
}

/** Creates a comment on a note (may also update note fields via raw_fields) */
export function useCreateComment(spaceSlug: string, noteNumber: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCommentRequest) =>
      httpClient.post(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}/comments`, { json: data }).json<Comment>(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["spaces", spaceSlug, "notes", noteNumber, "comments"] }),
        queryClient.invalidateQueries({ queryKey: ["spaces", spaceSlug, "notes", noteNumber], exact: true }),
      ])
    },
  })
}

/** Uploads attachment to space */
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

/** Uploads attachment to note */
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

/** Uploads pending attachment for image fields */
export function useUploadPendingAttachment() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return httpClient.post("api/v1/attachments/pending", { body: formData }).json<PendingAttachment>()
    },
  })
}

/** Deletes a pending attachment (admin list invalidation) */
export function useDeletePendingAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (number: number) => httpClient.delete(`api/v1/attachments/pending/${String(number)}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pending-attachments"] })
    },
  })
}

/** Sets a template for the space */
export function useSetTemplate(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, content }: { key: string } & SetTemplateRequest) =>
      httpClient.put(`api/v1/spaces/${spaceSlug}/templates/${key}`, { json: { content } }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Updates space telegram settings */
export function useUpdateSpaceTelegram(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateTelegramRequest) => httpClient.patch(`api/v1/spaces/${slug}/telegram`, { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

/** Updates space default filter */
export function useUpdateSpaceDefaultFilter(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateDefaultFilterRequest) =>
      httpClient.patch(`api/v1/spaces/${slug}/default-filter`, { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}
