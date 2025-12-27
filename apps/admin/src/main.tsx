import { runApp, createAppRouter } from "@spacenote/common/app"
import { routeTree } from "./routeTree.gen"

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter<typeof routeTree>>
  }
}

// Suppress react-live JSX transform warning (dev-only, harmless)
// eslint-disable-next-line no-console
const originalWarn = console.warn
// eslint-disable-next-line no-console
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("outdated JSX transform")) {
    return
  }
  originalWarn.apply(console, args)
}

runApp({ isAdmin: true }, routeTree)
