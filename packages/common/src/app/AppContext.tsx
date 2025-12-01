import { createContext, use, type ReactNode } from "react"

/** Configuration for app-specific behavior */
interface AppConfig {
  isAdmin: boolean
}

/** React context for app configuration */
const AppContext = createContext<AppConfig | null>(null)

/** Provider component for app configuration */
export function AppProvider({ config, children }: { config: AppConfig; children: ReactNode }) {
  return <AppContext value={config}>{children}</AppContext>
}

/** Hook to access app configuration */
export function useAppConfig(): AppConfig {
  const config = use(AppContext)
  if (!config) throw new Error("useAppConfig must be used within AppProvider")
  return config
}
