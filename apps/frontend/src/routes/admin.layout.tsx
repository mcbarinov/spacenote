import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { api } from "@/api"

export const Route = createFileRoute("/_auth/_admin")({
  beforeLoad: ({ context }) => {
    const currentUser = context.queryClient.getQueryData(api.queries.currentUser().queryKey)
    if (currentUser?.username !== "admin") {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/" })
    }
  },
  // Preload users list for admin child pages (users management, etc.)
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(api.queries.listUsers())
  },
  component: () => <Outlet />,
})
