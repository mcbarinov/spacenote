import { Navigate, Outlet } from "react-router"
import { useAuth } from "@/hooks/useAuth"

export default function PublicRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}
