import { useQueryClient } from "@tanstack/react-query"
import { NotFoundError } from "@/lib/errors"
import type { Space } from "@/types"

export function useSpace(slug: string): Space {
  const queryClient = useQueryClient()
  // Get spaces from cache since they're already loaded in AuthLayout
  const spaces = queryClient.getQueryData<Space[]>(["spaces"]) ?? []

  const space = spaces.find((s) => s.slug === slug)

  if (!space) {
    throw new NotFoundError(`Space with slug "${slug}" not found`)
  }

  return space
}
