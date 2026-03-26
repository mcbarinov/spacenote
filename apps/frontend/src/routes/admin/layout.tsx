/**
 * Admin layout guard.
 * Checks `is_admin` flag and redirects non-admins to home.
 * Preloads the users list for child admin pages.
 */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { api } from "@/api"

export const Route = createFileRoute("/_auth/_admin")({
  beforeLoad: ({ context }) => {
    const currentUser = context.queryClient.getQueryData(api.queries.currentUser().queryKey)
    if (!currentUser?.is_admin) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/" })
    }
  },
  // Preload users list for admin child pages (users management, etc.)
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(api.queries.listUsers()),
      context.queryClient.ensureQueryData(api.queries.listAllSpaces()),
    ])
  },
  component: () => <Outlet />,
})
