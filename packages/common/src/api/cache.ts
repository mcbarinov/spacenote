import { useSuspenseQuery } from "@tanstack/react-query"
import { AppError } from "../errors"
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

/** Gets a space by slug from cache */
export function useSpace(slug: string): Space {
  const spaces = useSpaces()
  const space = spaces.find((s) => s.slug === slug)
  if (!space) {
    throw new AppError("not_found", "Space not found")
  }
  return space
}

/** Gets a user by username from cache */
export function useUser(username: string): User {
  const users = useUsers()
  const user = users.find((u) => u.username === username)
  if (!user) {
    throw new AppError("not_found", "User not found")
  }
  return user
}
