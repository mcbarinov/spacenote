import { queryOptions } from "@tanstack/react-query"
import { httpClient } from "./httpClient"
import type { User } from "@spacenote/api-types"

export function currentUser() {
  return queryOptions({
    queryKey: ["currentUser"],
    queryFn: () => httpClient.get("api/v1/profile").json<User>(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
