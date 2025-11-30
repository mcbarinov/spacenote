import { runApp, createAppRouter } from "@spacenote/common/app"
import { routeTree } from "./routeTree.gen"

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter<typeof routeTree>>
  }
}

runApp({ isAdmin: true }, routeTree)
