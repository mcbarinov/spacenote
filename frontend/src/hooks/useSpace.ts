import { useSuspenseQuery } from "@tanstack/react-query"

import { spacesQueryOptions } from "@/lib/queries"
import { NotFoundError } from "@/lib/errors"
import type { Space } from "@/types"

export function useSpace(slug: string): Space {
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())

  const space = spaces.find((s) => s.slug === slug)

  if (!space) {
    throw new NotFoundError(`Space with slug "${slug}" not found`)
  }

  return space
}
