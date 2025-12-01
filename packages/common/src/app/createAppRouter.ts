import { createRouter, type AnyRoute } from "@tanstack/react-router"
import { queryClient } from "../api"

export function createAppRouter<T extends AnyRoute>(routeTree: T) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreloadStaleTime: 0,
  })
}
