import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import { devtools } from "@tanstack/devtools-vite"
import path from "path"

/** Requires env var to be set, throws if missing */
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: requireEnv("VITE_BASE_PATH"),
  plugins: [
    devtools({ eventBusConfig: { port: 42070 } }),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      virtualRouteConfig: "./src/routes/routes.ts",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server:
    command === "serve"
      ? {
          port: Number(requireEnv("VITE_PORT")),
          proxy: {
            "/api": {
              target: requireEnv("VITE_API_URL"),
              changeOrigin: true,
            },
          },
        }
      : undefined,
}))
