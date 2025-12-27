import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

/** Root layout component */
function RootComponent() {
  return <Outlet />
}

/** 404 page component */
function NotFoundComponent() {
  return (
    <div>
      <h1>404 - Not Found</h1>
    </div>
  )
}
