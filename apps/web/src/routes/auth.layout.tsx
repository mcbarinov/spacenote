import { createFileRoute, redirect } from "@tanstack/react-router"
import { api } from "@spacenote/common/api"
import { AppError } from "@spacenote/common/errors"
import { AuthLayout, LoadingScreen, ErrorScreen } from "@spacenote/common/components"

export const Route = createFileRoute("/_auth.layout")({
  // Validates auth and redirects to login if unauthorized
  beforeLoad: async ({ context, location }) => {
    try {
      const currentUser = await context.queryClient.ensureQueryData(api.queries.currentUser())
      return { currentUser }
    } catch (error) {
      const appError = AppError.fromUnknown(error)

      // Redirect to login for both unauthorized (not logged in) and forbidden (wrong role)
      if (appError.code === "unauthorized" || appError.code === "forbidden") {
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
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(api.queries.listSpaces())
  },
  errorComponent: ErrorScreen,
  pendingComponent: LoadingScreen,
  component: AuthLayout,
})
