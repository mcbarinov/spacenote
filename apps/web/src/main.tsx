import { initHttpClient } from "@spacenote/common/api"
import { renderApp, createAppRouter } from "@spacenote/common/app"
import { routeTree } from "./routeTree.gen"

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter<typeof routeTree>>
  }
}

initHttpClient("web")
renderApp(createAppRouter(routeTree))
