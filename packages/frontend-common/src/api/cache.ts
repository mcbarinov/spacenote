import { useSuspenseQuery } from "@tanstack/react-query"
import type { User } from "../types"
import { currentUser, listUsers } from "./queries"

/**
 * Hook to get the current authenticated user from the query cache.
 */
export function useCurrentUser(): User {
  const { data } = useSuspenseQuery(currentUser())
  return data
}

/**
 * Hook to get the list of all users from the query cache.
 */
export function useUsers(): User[] {
  const { data } = useSuspenseQuery(listUsers())
  return data
}
