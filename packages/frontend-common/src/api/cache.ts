import { useSuspenseQuery } from "@tanstack/react-query"
import type { Space, User } from "../types"
import { currentUser, listSpaces, listUsers } from "./queries"

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

/**
 * Hook to get the list of all spaces from the query cache.
 */
export function useSpaces(): Space[] {
  const { data } = useSuspenseQuery(listSpaces())
  return data
}
