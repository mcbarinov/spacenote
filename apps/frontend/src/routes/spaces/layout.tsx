/**
 * Space management layout guard.
 * Validates that the space exists and the current user has "all" permission.
 */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { api } from "@/api"

export const Route = createFileRoute("/_auth/_spaces")({
  beforeLoad: async ({ context, params }) => {
    if (!("slug" in params)) return

    const currentUser = await context.queryClient.ensureQueryData(api.queries.currentUser())
    const spaces = await context.queryClient.ensureQueryData(api.queries.listSpaces())
    const space = spaces.find((s) => s.slug === (params as Record<string, string>).slug)

    if (!space) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/" })
    }

    const member = space.members.find((m) => m.username === currentUser.username)
    if (!member?.permissions.includes("all")) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/" })
    }
  },
  component: () => <Outlet />,
})
