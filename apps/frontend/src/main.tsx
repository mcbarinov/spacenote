import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/dates/styles.css"
import { MantineProvider } from "@mantine/core"
import { DatesProvider } from "@mantine/dates"
import { Notifications } from "@mantine/notifications"
import { ModalsProvider } from "@mantine/modals"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { QueryClientProvider } from "@tanstack/react-query"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { isExpectedError } from "@/errors/AppError"
import { queryClient } from "@/api"
import { routeTree } from "./routeTree.gen"

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreloadStaleTime: 0,
  basepath: import.meta.env.BASE_URL,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Root element not found")

createRoot(rootElement, {
  // Don't log expected errors handled by ErrorBoundary
  onCaughtError: (error) => {
    if (isExpectedError(error)) return
    // eslint-disable-next-line no-console
    console.error(error)
  },
}).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="light">
        <DatesProvider settings={{ firstDayOfWeek: 1 }}>
          <ModalsProvider>
            <Notifications />
            <RouterProvider router={router} />
            <TanStackDevtools
              plugins={[
                { name: "TanStack Query", render: <ReactQueryDevtoolsPanel />, defaultOpen: false },
                { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel router={router} />, defaultOpen: false },
              ]}
            />
          </ModalsProvider>
        </DatesProvider>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>
)
