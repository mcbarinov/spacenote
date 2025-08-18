import { createBrowserRouter } from "react-router"
import RootLayout from "@/components/layout/RootLayout"
import AuthLayout from "@/components/layout/AuthLayout"
import HomePage from "@/components/pages/HomePage"
import LoginPage from "@/components/pages/LoginPage"
import SpacesPage from "@/components/pages/SpacesPage"
import SpaceNewPage from "@/components/pages/SpaceNewPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <AuthLayout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/spaces", element: <SpacesPage /> },
          { path: "/spaces/new", element: <SpaceNewPage /> },
          { path: "/change-password", element: <div>Change Password Page (TODO)</div> },
        ],
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
])
