import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router"
import { Box, Container, Flex } from "@mantine/core"
import { api } from "@/api"
import { AppError } from "@/errors/AppError"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ErrorScreen } from "@/components/ErrorScreen"
import { LoadingScreen } from "@/components/LoadingScreen"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export const Route = createFileRoute("/_auth")({
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

/** Layout for authenticated pages with header, footer, and error handling */
function AuthLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Container size="lg">
      <Flex direction="column" mih="100vh">
        <Header />
        <Box component="main" flex={1} py="md">
          <ErrorBoundary
            resetKey={location.pathname}
            onUnauthorized={() => {
              void navigate({
                to: "/login",
                search: { redirect: window.location.href },
                replace: true,
              })
            }}
          >
            <Outlet />
          </ErrorBoundary>
        </Box>
        <Footer />
      </Flex>
    </Container>
  )
}
