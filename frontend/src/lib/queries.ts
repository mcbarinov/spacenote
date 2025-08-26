/**
 * Centralized data fetching layer using TanStack Query.
 *
 * Architecture Rules:
 * 1. Components MUST use hooks from this file, never import api directly
 * 2. All queries use queryOptions for consistent caching
 * 3. Mutations handle ONLY data operations (cache invalidation)
 * 4. UI feedback (toasts, navigation) belongs in component-level mutate callbacks
 * 5. Error handling is centralized via global mutation defaults
 * 6. Exception: AuthProvider can use api.login/logout directly
 *
 * Mutation Pattern:
 * - useMutation hook: Cache invalidation only
 * - Component mutate(): UI feedback (toast.success, navigate)
 */

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import type { CreateSpaceRequest, SpaceField, CreateNoteRequest, CreateCommentRequest } from "../types"

export const usersQueryOptions = () =>
  queryOptions({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
    staleTime: Infinity, // Never consider users data stale
    gcTime: Infinity, // Never remove from memory - permanent cache
  })

export const spacesQueryOptions = () =>
  queryOptions({
    queryKey: ["spaces"],
    queryFn: () => api.getSpaces(),
    staleTime: Infinity, // Never consider spaces data stale
    gcTime: Infinity, // Never remove from memory - permanent cache
  })

export const useCreateSpaceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSpaceRequest) => api.createSpace(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export const useAddFieldMutation = (spaceSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SpaceField) => api.addFieldToSpace(spaceSlug, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export const useUpdateSpaceMembersMutation = (spaceSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (usernames: string[]) => api.updateSpaceMembers(spaceSlug, usernames),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export const notesQueryOptions = (spaceSlug: string) =>
  queryOptions({
    queryKey: ["notes", spaceSlug],
    queryFn: () => api.getNotesBySpace(spaceSlug),
  })

export const noteQueryOptions = (spaceSlug: string, number: number) =>
  queryOptions({
    queryKey: ["notes", spaceSlug, number],
    queryFn: () => api.getNote(spaceSlug, number),
  })

export const useCreateNoteMutation = (spaceSlug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateNoteRequest) => api.createNote(spaceSlug, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes", spaceSlug] })
    },
  })
}

export const commentsQueryOptions = (spaceSlug: string, noteNumber: number) =>
  queryOptions({
    queryKey: ["comments", spaceSlug, noteNumber],
    queryFn: () => api.getNoteComments(spaceSlug, noteNumber),
  })

export const useCreateCommentMutation = (spaceSlug: string, noteNumber: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => api.createComment(spaceSlug, noteNumber, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comments", spaceSlug, noteNumber] })
    },
  })
}
