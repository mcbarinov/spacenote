import { Outlet } from "react-router"
import { AuthProvider } from "@/contexts/auth"

export default function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
