import { useSuspenseQuery } from "@tanstack/react-query"
import type { User } from "../types"
import { currentUser } from "./queries"

/**
 * Hook to get the current authenticated user from the query cache.
 */
export function useCurrentUser(): User {
  const { data } = useSuspenseQuery(currentUser())
  return data
}
