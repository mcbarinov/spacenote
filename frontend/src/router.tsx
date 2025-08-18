import { createBrowserRouter } from "react-router"
import RootLayout from "@/components/layouts/RootLayout"
import AuthLayout from "@/components/layouts/AuthLayout"
import PublicRoute from "@/components/layouts/PublicRoute"
import Home from "@/components/pages/Home"
import Login from "@/components/pages/Login"
import Spaces from "@/components/pages/Spaces"
import SpaceNew from "@/components/pages/SpaceNew"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/", element: <Home /> },
          { path: "/spaces", element: <Spaces /> },
          { path: "/spaces/new", element: <SpaceNew /> },
          { path: "/change-password", element: <div>Change Password Page (TODO)</div> },
        ],
      },
      {
        element: <PublicRoute />,
        children: [{ path: "/login", element: <Login /> }],
      },
    ],
  },
])
