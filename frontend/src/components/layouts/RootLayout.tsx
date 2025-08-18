import { Outlet } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/contexts/auth"

export default function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  )
}
