import { queryOptions } from "@tanstack/react-query"
import { httpClient } from "./httpClient"
import type { Attachment, CommentsList, ExportData, Note, NotesList, Space, User } from "../types"

/** Default page size for comments pagination */
export const COMMENTS_PAGE_LIMIT = 100

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

/** Fetches notes for a space with optional filter */
export function listNotes(spaceSlug: string, filter?: string) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", { filter }],
    queryFn: () => {
      const searchParams = filter ? { filter } : undefined
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
