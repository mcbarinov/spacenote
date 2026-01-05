import { queryOptions } from "@tanstack/react-query"
import { httpClient } from "./httpClient"
import type {
  Attachment,
  CommentsList,
  ExportData,
  Note,
  NotesList,
  PendingAttachmentsList,
  Space,
  TelegramMirrorsList,
  TelegramTasksList,
  TelegramTaskStatus,
  TelegramTaskType,
  User,
} from "../types"

/** Default page size for comments pagination */
export const COMMENTS_PAGE_LIMIT = 100

/** Default page size for notes pagination */
export const NOTES_PAGE_LIMIT = 50

/** Fetches current authenticated user */
export function currentUser() {
  return queryOptions({
    queryKey: ["currentUser"],
    queryFn: () => httpClient.get("api/v1/profile").json<User>(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

/** Fetches all users (admin only) */
export function listUsers() {
  return queryOptions({
    queryKey: ["users"],
    queryFn: () => httpClient.get("api/v1/users").json<User[]>(),
  })
}

/** Fetches all spaces */
export function listSpaces() {
  return queryOptions({
    queryKey: ["spaces"],
    queryFn: () => httpClient.get("api/v1/spaces").json<Space[]>(),
  })
}

/** Fetches paginated notes for a space with optional filter and adhoc query */
export function listNotes(spaceSlug: string, filter?: string, q?: string, page = 1, limit = NOTES_PAGE_LIMIT) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", { filter, q, page, limit }],
    queryFn: () => {
      const searchParams: Record<string, string | number> = {}
      if (filter) searchParams.filter = filter
      if (q) searchParams.q = q
      searchParams.limit = limit
      searchParams.offset = (page - 1) * limit
      return httpClient.get(`api/v1/spaces/${spaceSlug}/notes`, { searchParams }).json<NotesList>()
    },
  })
}

/** Fetches a single note by number */
export function getNote(spaceSlug: string, noteNumber: number) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", noteNumber],
    queryFn: () => httpClient.get(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}`).json<Note>(),
  })
}

/** Fetches paginated comments for a note */
export function listComments(spaceSlug: string, noteNumber: number, page = 1, limit = COMMENTS_PAGE_LIMIT) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", noteNumber, "comments", { page, limit }],
    queryFn: () =>
      httpClient
        .get(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}/comments`, {
          searchParams: { limit, offset: (page - 1) * limit },
        })
        .json<CommentsList>(),
  })
}

/** Fetches attachments for a space */
export function listSpaceAttachments(spaceSlug: string) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "attachments"],
    queryFn: () => httpClient.get(`api/v1/spaces/${spaceSlug}/attachments`).json<Attachment[]>(),
  })
}

/** Fetches attachments for a note */
export function listNoteAttachments(spaceSlug: string, noteNumber: number) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", noteNumber, "attachments"],
    queryFn: () => httpClient.get(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}/attachments`).json<Attachment[]>(),
  })
}

/** Fetches space export data */
export function exportSpace(spaceSlug: string, includeData: boolean) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "export", { includeData }],
    queryFn: () =>
      httpClient.get(`api/v1/spaces/${spaceSlug}/export`, { searchParams: { include_data: includeData } }).json<ExportData>(),
  })
}

/** Fetches paginated telegram tasks (admin only) */
export function listTelegramTasks(params?: {
  space_slug?: string | null
  task_type?: TelegramTaskType | null
  status?: TelegramTaskStatus | null
  limit?: number
  offset?: number
}) {
  return queryOptions({
    queryKey: ["telegram", "tasks", params],
    queryFn: () => {
      const searchParams: Record<string, string | number> = {}
      if (params?.space_slug) searchParams.space_slug = params.space_slug
      if (params?.task_type) searchParams.task_type = params.task_type
      if (params?.status) searchParams.status = params.status
      if (params?.limit) searchParams.limit = params.limit
      if (params?.offset) searchParams.offset = params.offset
      return httpClient.get("api/v1/telegram/tasks", { searchParams }).json<TelegramTasksList>()
    },
  })
}

/** Fetches paginated telegram mirrors (admin only) */
export function listTelegramMirrors(params?: { space_slug?: string | null; limit?: number; offset?: number }) {
  return queryOptions({
    queryKey: ["telegram", "mirrors", params],
    queryFn: () => {
      const searchParams: Record<string, string | number> = {}
      if (params?.space_slug) searchParams.space_slug = params.space_slug
      if (params?.limit) searchParams.limit = params.limit
      if (params?.offset) searchParams.offset = params.offset
      return httpClient.get("api/v1/telegram/mirrors", { searchParams }).json<TelegramMirrorsList>()
    },
  })
}

/** Fetches paginated pending attachments (admin only) */
export function listPendingAttachments(params?: { limit?: number; offset?: number }) {
  return queryOptions({
    queryKey: ["pending-attachments", params],
    queryFn: () => {
      const searchParams: Record<string, number> = {}
      if (params?.limit) searchParams.limit = params.limit
      if (params?.offset) searchParams.offset = params.offset
      return httpClient.get("api/v1/attachments/pending", { searchParams }).json<PendingAttachmentsList>()
    },
  })
}
