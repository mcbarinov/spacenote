import { queryOptions } from "@tanstack/react-query"
import { httpClient } from "./httpClient"
import { cleanParams } from "@/utils/format"
import type {
  Attachment,
  CommentsList,
  ExportData,
  Note,
  NotesList,
  PendingAttachmentsList,
  Space,
  TelegramMirrorsList,
  TelegramTaskStatus,
  TelegramTaskType,
  TelegramTasksList,
  User,
} from "@/types"

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

/** Fetches all spaces regardless of membership (admin only) */
export function listAllSpaces() {
  return queryOptions({
    queryKey: ["admin", "spaces"],
    queryFn: () => httpClient.get("api/v1/spaces/all").json<Space[]>(),
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
  space_slug?: string
  task_type?: TelegramTaskType
  status?: TelegramTaskStatus
  limit?: number
  offset?: number
}) {
  return queryOptions({
    queryKey: ["telegram", "tasks", params],
    queryFn: () => httpClient.get("api/v1/telegram/tasks", { searchParams: cleanParams(params) }).json<TelegramTasksList>(),
  })
}

/** Fetches paginated telegram mirrors (admin only) */
export function listTelegramMirrors(params?: { space_slug?: string; limit?: number; offset?: number }) {
  return queryOptions({
    queryKey: ["telegram", "mirrors", params],
    queryFn: () => httpClient.get("api/v1/telegram/mirrors", { searchParams: cleanParams(params) }).json<TelegramMirrorsList>(),
  })
}

/** Fetches paginated notes for a space with optional filter, query, and pagination */
export function listNotes(spaceSlug: string, filter?: string, q?: string, page = 1, limit = NOTES_PAGE_LIMIT) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", { filter, q, page, limit }],
    queryFn: () => {
      const offset = (page - 1) * limit
      const searchParams = cleanParams({ filter, q, limit, offset })
      return httpClient.get(`api/v1/spaces/${spaceSlug}/notes`, { searchParams }).json<NotesList>()
    },
  })
}

/** Fetches a single note by number */
export function getNote(spaceSlug: string, noteNumber: number) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", noteNumber],
    queryFn: () => httpClient.get(`api/v1/spaces/${spaceSlug}/notes/${noteNumber}`).json<Note>(),
  })
}

/** Fetches paginated comments for a note */
export function listComments(spaceSlug: string, noteNumber: number, page = 1, limit = COMMENTS_PAGE_LIMIT) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", noteNumber, "comments", { page, limit }],
    queryFn: () =>
      httpClient
        .get(`api/v1/spaces/${spaceSlug}/notes/${noteNumber}/comments`, {
          searchParams: { limit, offset: (page - 1) * limit },
        })
        .json<CommentsList>(),
  })
}

/** Fetches all attachments for a note */
export function listNoteAttachments(spaceSlug: string, noteNumber: number) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", noteNumber, "attachments"],
    queryFn: () => httpClient.get(`api/v1/spaces/${spaceSlug}/notes/${noteNumber}/attachments`).json<Attachment[]>(),
  })
}

/** Fetches all attachments for a space */
export function listSpaceAttachments(spaceSlug: string) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "attachments"],
    queryFn: () => httpClient.get(`api/v1/spaces/${spaceSlug}/attachments`).json<Attachment[]>(),
  })
}

/** Fetches paginated pending attachments (admin only) */
export function listPendingAttachments(params?: { limit?: number; offset?: number }) {
  return queryOptions({
    queryKey: ["pending-attachments", params],
    queryFn: () =>
      httpClient.get("api/v1/attachments/pending", { searchParams: cleanParams(params) }).json<PendingAttachmentsList>(),
  })
}
