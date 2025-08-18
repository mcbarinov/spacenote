import React from "react"
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/contexts/auth"
import { useAuth } from "@/hooks/useAuth"
import Home from "@/components/pages/Home"
import Login from "@/components/pages/Login"

function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}

function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [{ path: "/", element: <Home /> }],
      },
      {
        element: <PublicRoute />,
        children: [{ path: "/login", element: <Login /> }],
      },
    ],
  },
])

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  )
}

export default App
