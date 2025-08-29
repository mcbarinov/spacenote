import { useQueryClient } from "@tanstack/react-query"
import { NotFoundError } from "@/lib/errors"
import type { User } from "@/types"

/**
 * Hook to get a user by username.
 * Uses the cached users data to lookup user information.
 *
 * @param username - The username to lookup
 * @returns The User object
 * @throws {NotFoundError} If user is not found
 */
export function useUser(username: string): User {
  const queryClient = useQueryClient()
  // Get users from cache since they're already loaded in AuthLayout
  const users = queryClient.getQueryData<User[]>(["users"]) ?? []

  const user = users.find((u) => u.username === username)

  if (!user) {
    throw new NotFoundError(`User with username "${username}" not found`)
  }

  return user
}
