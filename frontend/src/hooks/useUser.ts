import { useSuspenseQuery } from "@tanstack/react-query"
import { usersQueryOptions } from "@/lib/queries"
import { NotFoundError } from "@/lib/errors"
import type { User } from "@/types"

/**
 * Hook to get a user by ID.
 * Uses the cached users data to lookup user information.
 *
 * @param userId - The user ID to lookup
 * @returns The User object
 * @throws {NotFoundError} If user is not found
 */
export function useUser(userId: string): User {
  const { data: users } = useSuspenseQuery(usersQueryOptions())

  const user = users.find((u) => u.id === userId)

  if (!user) {
    throw new NotFoundError(`User with id "${userId}" not found`)
  }

  return user
}
