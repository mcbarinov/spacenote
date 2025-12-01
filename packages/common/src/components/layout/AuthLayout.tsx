import { Outlet, useLocation, useNavigate } from "@tanstack/react-router"
import { Box, Container, Flex } from "@mantine/core"
import { ErrorBoundary } from "../errors/ErrorBoundary"
import { Header } from "./Header"
import { Footer } from "./Footer"

export function AuthLayout() {
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
