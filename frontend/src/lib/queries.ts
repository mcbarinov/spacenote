import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import type { CreateSpaceRequest } from "../types"

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
