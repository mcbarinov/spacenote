import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { Center, Alert } from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"

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

/** 404 page component */
function NotFoundComponent() {
  return (
    <Center h="100vh" p="md">
      <Alert icon={<IconAlertCircle />} title="Not Found" color="red" maw={800}>
        The page you are looking for does not exist.
      </Alert>
    </Center>
  )
}
