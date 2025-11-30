import { createContext, use, type ReactNode } from "react"

interface AppConfig {
  isAdmin: boolean
}

const AppContext = createContext<AppConfig | null>(null)

export function AppProvider({ config, children }: { config: AppConfig; children: ReactNode }) {
  return <AppContext value={config}>{children}</AppContext>
}

export function useAppConfig(): AppConfig {
  const config = use(AppContext)
  if (!config) throw new Error("useAppConfig must be used within AppProvider")
  return config
}
