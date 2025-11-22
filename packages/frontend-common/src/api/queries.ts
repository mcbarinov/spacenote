import { queryOptions } from "@tanstack/react-query"
import { httpClient } from "./httpClient"
import type { User } from "../types"

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
