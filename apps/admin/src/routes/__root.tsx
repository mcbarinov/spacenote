import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

/** Root layout component that renders child routes */
function RootComponent() {
  return <Outlet />
}

/** Fallback component for unmatched routes */
function NotFoundComponent() {
  return (
    <div>
      <h1>404 - Not Found</h1>
    </div>
  )
}
