import { createRouter } from "@tanstack/react-router"
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query"
import { routeTree } from "./routeTree.gen"
import { notifications } from "@mantine/notifications"
import { AppError } from "@/errors/AppError"

interface RouterContext {
  queryClient: QueryClient
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry logic: only retry server/network errors, not client errors
      retry: (failureCount, error) => {
        const appError = AppError.fromUnknown(error)

        // Never retry client errors (won't succeed anyway)
        if (["unauthorized", "forbidden", "not_found", "bad_request", "validation"].includes(appError.code)) {
          return false
        }

        // Retry transient failures (server errors, network issues) up to 3 times
        if (["server_error", "network_error"].includes(appError.code)) {
          return failureCount < 3
        }

        return false
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: false, // Mutations should fail fast
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      const appError = AppError.fromUnknown(error)

      // Only show error toasts for background refetches when there's existing data
      // This prevents duplicate error notifications on initial load
      if (query.state.data !== undefined) {
        notifications.show({ message: appError.message, color: "red" })
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const appError = AppError.fromUnknown(error)

      // Log all mutation errors for monitoring
      // eslint-disable-next-line no-console
      console.error("Mutation error:", appError)
    },
  }),
})

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
