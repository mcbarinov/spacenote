import { useSuspenseQuery } from "@tanstack/react-query"

import { spacesQueryOptions } from "@/lib/queries"
import { NotFoundError } from "@/lib/errors"
import type { Space } from "@/types"

export function useSpace(spaceId: string): Space {
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())

  const space = spaces.find((s) => s.id === spaceId)

  if (!space) {
    throw new NotFoundError(`Space with ID "${spaceId}" not found`)
  }

  return space
}
