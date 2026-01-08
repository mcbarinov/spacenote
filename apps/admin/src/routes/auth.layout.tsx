import { createFileRoute, redirect } from "@tanstack/react-router"
import { api } from "@spacenote/common/api"
import { AppError } from "@spacenote/common/errors"
import { AuthLayout, LoadingScreen, ErrorScreen } from "@spacenote/common/components"

export const Route = createFileRoute("/_auth")({
  // Validates auth and redirects to login if unauthorized
  beforeLoad: async ({ context, location }) => {
    try {
      const currentUser = await context.queryClient.ensureQueryData(api.queries.currentUser())
      return { currentUser }
    } catch (error) {
      const appError = AppError.fromUnknown(error)

      if (appError.code === "unauthorized" || appError.code === "forbidden") {
        // TanStack Router requires throwing redirect() which is not an Error instance
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw redirect({
          to: "/login",
          search: {
            redirect: location.href,
          },
        })
      }

      throw error
    }
  },
  // Preload global data (users and spaces) for child routes
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(api.queries.listUsers()),
      context.queryClient.ensureQueryData(api.queries.listSpaces()),
    ])
  },
  errorComponent: ErrorScreen,
  pendingComponent: LoadingScreen,
  component: AuthLayout,
})
