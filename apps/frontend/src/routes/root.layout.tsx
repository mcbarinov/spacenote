import { Link, Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { Button, Center, Stack, Text, Title } from "@mantine/core"

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

function NotFoundComponent() {
  return (
    <Center h="100vh" p="md">
      <Stack align="center" gap="lg">
        <Text component={Link} to="/" size="xl" fw={700} style={{ textDecoration: "none", color: "inherit" }}>
          SpaceNote
        </Text>
        <Title order={2}>Page not found</Title>
        <Text c="dimmed">The page you are looking for does not exist.</Text>
        <Button component={Link} to="/" variant="light">
          Go to home page
        </Button>
      </Stack>
    </Center>
  )
}
