import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/dates/styles.css"
import { MantineProvider } from "@mantine/core"
import { DatesProvider } from "@mantine/dates"
import { Notifications } from "@mantine/notifications"
import { ModalsProvider } from "@mantine/modals"
import { RouterProvider, type AnyRoute } from "@tanstack/react-router"
import { QueryClientProvider } from "@tanstack/react-query"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { initHttpClient, queryClient } from "../api"
import { createAppRouter } from "./createAppRouter"
import { AppProvider } from "./AppContext"

interface AppConfig {
  isAdmin: boolean
}

/** Initialize and render the app with all providers (Mantine, TanStack Query/Router, etc.) */
export function runApp(config: AppConfig, routeTree: AnyRoute) {
  initHttpClient(config.isAdmin ? "admin" : "web")
  const router = createAppRouter(routeTree)

  const rootElement = document.getElementById("root")
  if (!rootElement) throw new Error("Root element not found")

  createRoot(rootElement).render(
    <StrictMode>
      <AppProvider config={config}>
        <MantineProvider defaultColorScheme="light">
          <DatesProvider settings={{ firstDayOfWeek: 1 }}>
            <ModalsProvider>
              <Notifications />
              <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <TanStackDevtools
                  plugins={[
                    { name: "TanStack Query", render: <ReactQueryDevtoolsPanel />, defaultOpen: false },
                    { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel router={router} />, defaultOpen: false },
                  ]}
                />
              </QueryClientProvider>
            </ModalsProvider>
          </DatesProvider>
        </MantineProvider>
      </AppProvider>
    </StrictMode>
  )
}
