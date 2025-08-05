import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"

// Spaces queries
export const spacesQueryOptions = () =>
  queryOptions({
    queryKey: ["spaces"],
    queryFn: () => api.getSpaces(),
    staleTime: 1000 * 60 * 5, // 5 minutes - spaces don't change frequently
  })

export const spaceQueryOptions = (spaceId: string) =>
  queryOptions({
    queryKey: ["spaces", spaceId],
    queryFn: () => api.getSpace(spaceId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

// Notes queries for a specific space
export const spaceNotesQueryOptions = (spaceId: string) =>
  queryOptions({
    queryKey: ["spaces", spaceId, "notes"],
    queryFn: () => api.getSpaceNotes(spaceId),
    staleTime: 1000 * 30, // 30 seconds - notes change more frequently
  })

export const noteQueryOptions = (noteId: string) =>
  queryOptions({
    queryKey: ["notes", noteId],
    queryFn: () => api.getNote(noteId),
    staleTime: 1000 * 30, // 30 seconds
  })