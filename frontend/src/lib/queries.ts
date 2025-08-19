/**
 * Centralized data fetching layer using TanStack Query.
 *
 * Architecture Rules:
 * 1. Components MUST use hooks from this file, never import api directly
 * 2. All queries use queryOptions for consistent caching
 * 3. All mutations are custom hooks with built-in error handling
 * 4. Exception: AuthProvider can use api.login/logout directly
 */

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import type { CreateSpaceRequest, AddFieldRequest } from "../types"

export const spacesQueryOptions = () =>
  queryOptions({
    queryKey: ["spaces"],
    queryFn: () => api.getSpaces(),
    staleTime: Infinity, // Never consider spaces data stale
    gcTime: Infinity, // Never remove from memory - permanent cache
  })

export const useCreateSpaceMutation = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: CreateSpaceRequest) => api.createSpace(data),
    onSuccess: (space) => {
      void queryClient.invalidateQueries({ queryKey: ["spaces"] })
      toast.success("Space created successfully")
      void navigate(`/spaces/${space.slug}`)
    },
  })
}

export const useAddFieldMutation = (spaceSlug: string) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: AddFieldRequest) => api.addFieldToSpace(spaceSlug, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spaces"] })
      toast.success("Field added successfully")
      void navigate(`/spaces/${spaceSlug}/fields`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add field")
    },
  })
}
