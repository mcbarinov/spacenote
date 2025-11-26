import { queryOptions } from "@tanstack/react-query"
import { httpClient } from "./httpClient"
import type { NotesList, Space, User } from "../types"

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
