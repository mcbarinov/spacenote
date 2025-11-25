import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router"
import { Alert, Box, Center, Container, Flex } from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"
import { AppError } from "@spacenote/common/errors"
import { ErrorBoundary } from "@spacenote/common/components"
import Header from "./-components/layout/Header"
import Footer from "./-components/layout/Footer"

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context, location }) => {
    try {
      const currentUser = await context.queryClient.ensureQueryData(api.queries.currentUser())
      return { currentUser }
    } catch (error) {
      const appError = AppError.fromUnknown(error)

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
  errorComponent: ErrorComponent,
  pendingComponent: LoadingComponent,
  component: AuthLayoutComponent,
})

function LoadingComponent() {
  return (
    <Center h="100vh">
      <div>Loading...</div>
    </Center>
  )
}

function ErrorComponent({ error }: { error: Error }) {
  const appError = AppError.fromUnknown(error)

  return (
    <Center h="100vh" p="md">
      <Alert icon={<IconAlertCircle />} title={appError.title} color="red" maw={800}>
        {appError.message}
      </Alert>
    </Center>
  )
}

function AuthLayoutComponent() {
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
