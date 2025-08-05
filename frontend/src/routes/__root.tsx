import { createRootRouteWithContext, Outlet, redirect, useLocation } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import type { QueryClient } from "@tanstack/react-query"

import type { AuthContext } from "@/auth"
import { useAuth } from "@/auth"
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout"

interface RouterContext {
  auth: AuthContext
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context, location }) => {
    // Only allow /login route without authentication
    if (location.pathname === "/login") {
      return
    }

    // All other routes require authentication
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const location = useLocation()
  const auth = useAuth()

  // If login page, render without authenticated layout
  if (location.pathname === "/login") {
    return (
      <>
        <Outlet />
        <TanStackRouterDevtools />
      </>
    )
  }

  // If user is not authenticated, don't render AuthenticatedLayout
  // (this handles the logout transition case)
  if (!auth.isAuthenticated) {
    return (
      <>
        <Outlet />
        <TanStackRouterDevtools />
      </>
    )
  }

  // All other routes get authenticated layout automatically
  return (
    <>
      <AuthenticatedLayout />
      <TanStackRouterDevtools />
    </>
  )
}
