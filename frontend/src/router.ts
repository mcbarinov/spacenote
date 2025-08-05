import { createRouter } from "@tanstack/react-router"

import { routeTree } from "@/routeTree.gen"
import { ErrorComponent } from "@/components/router/ErrorComponent"
import { NotFoundComponent } from "@/components/router/NotFoundComponent"
import { PendingComponent } from "@/components/router/PendingComponent"

// Create a new router instance
export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    queryClient: undefined!,
  },
  defaultPreload: false,
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  // Default components for all routes
  defaultPendingComponent: PendingComponent,
  defaultErrorComponent: ErrorComponent,
  defaultNotFoundComponent: NotFoundComponent,
  defaultPendingMs: 100, // Show pending component after 100ms (faster feedback)
  defaultPendingMinMs: 500, // But show it for at least 500ms to avoid flashing
})

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
