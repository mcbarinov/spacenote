import { createRouter } from "@tanstack/react-router"
import { QueryClient } from "@tanstack/react-query"
import { routeTree } from "./routeTree.gen"
import { queryClient } from "./api"

interface RouterContext {
  queryClient: QueryClient
}

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  } satisfies RouterContext,
  // Disable router's built-in cache to delegate all caching to TanStack Query.
  // With defaultPreloadStaleTime: 0, every preload/load/reload event triggers loader functions,
  // allowing TanStack Query to handle deduplication, cache invalidation, and staleTime logic.
  // Without this, router's SWR cache would conflict with Query's cache management.
  defaultPreloadStaleTime: 0,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
