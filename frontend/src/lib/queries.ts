import { queryOptions } from "@tanstack/react-query"
import { api } from "./api"

export const spacesQueryOptions = () =>
  queryOptions({
    queryKey: ["spaces"],
    queryFn: () => api.getSpaces(),
    staleTime: Infinity, // Never consider spaces data stale
    gcTime: Infinity, // Never remove from memory - permanent cache
  })
