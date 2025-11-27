import { queryOptions } from "@tanstack/react-query"
import { httpClient } from "./httpClient"
import type { Attachment, CommentsList, Note, NotesList, Space, User } from "../types"

export const COMMENTS_PAGE_LIMIT = 100

export function currentUser() {
  return queryOptions({
    queryKey: ["currentUser"],
    queryFn: () => httpClient.get("api/v1/profile").json<User>(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function listUsers() {
  return queryOptions({
    queryKey: ["users"],
    queryFn: () => httpClient.get("api/v1/users").json<User[]>(),
  })
}

export function listSpaces() {
  return queryOptions({
    queryKey: ["spaces"],
    queryFn: () => httpClient.get("api/v1/spaces").json<Space[]>(),
  })
}

export function listNotes(spaceSlug: string) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes"],
    queryFn: () => httpClient.get(`api/v1/spaces/${spaceSlug}/notes`).json<NotesList>(),
  })
}

export function getNote(spaceSlug: string, noteNumber: number) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", noteNumber],
    queryFn: () => httpClient.get(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}`).json<Note>(),
  })
}

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

export function listSpaceAttachments(spaceSlug: string) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "attachments"],
    queryFn: () => httpClient.get(`api/v1/spaces/${spaceSlug}/attachments`).json<Attachment[]>(),
  })
}

export function listNoteAttachments(spaceSlug: string, noteNumber: number) {
  return queryOptions({
    queryKey: ["spaces", spaceSlug, "notes", noteNumber, "attachments"],
    queryFn: () => httpClient.get(`api/v1/spaces/${spaceSlug}/notes/${String(noteNumber)}/attachments`).json<Attachment[]>(),
  })
}
