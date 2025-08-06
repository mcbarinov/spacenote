import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import { api, type CreateSpaceRequest } from "@/lib/api"
import type { SpaceField } from "@/types"

// Spaces queries
export const spacesQueryOptions = () =>
  queryOptions({
    queryKey: ["spaces"],
    queryFn: () => api.getSpaces(),
    staleTime: Infinity, // Never consider spaces data stale
    gcTime: Infinity, // Never remove from memory - permanent cache
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

// Spaces mutations
export const useCreateSpaceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateSpaceRequest) => api.createSpace(request),
    onSuccess: () => {
      // Invalidate spaces list to show the new space
      void queryClient.invalidateQueries({
        queryKey: ["spaces"],
      })
    },
  })
}

export const useCreateFieldMutation = (spaceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (field: SpaceField) => api.createField(spaceId, field),
    onSuccess: () => {
      // Invalidate all spaces to show the new field
      void queryClient.invalidateQueries({
        queryKey: ["spaces"],
      })
    },
  })
}

export const useRefreshSpacesMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      void queryClient.invalidateQueries({
        queryKey: ["spaces"],
      })
    },
  })
}
