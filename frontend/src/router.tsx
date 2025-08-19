import { createBrowserRouter, Outlet } from "react-router"
import { AuthProvider } from "@/contexts/auth"
import AuthLayout from "@/components/layout/AuthLayout"
import HomePage from "@/components/pages/HomePage"
import LoginPage from "@/components/pages/LoginPage"
import SpacesPage from "@/components/pages/spaces/SpacesPage"
import SpaceNewPage from "@/components/pages/spaces/SpaceNewPage"
import SpaceFieldsPage from "@/components/pages/spaces/fields/SpaceFieldsPage"
import SpaceFieldNewPage from "@/components/pages/spaces/fields/SpaceFieldNewPage"
import NotesListPage from "@/components/pages/notes/NotesListPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      {
        path: "/",
        element: <AuthLayout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/s/:slug", element: <NotesListPage /> },
          { path: "/spaces", element: <SpacesPage /> },
          { path: "/spaces/new", element: <SpaceNewPage /> },
          { path: "/spaces/:slug/fields", element: <SpaceFieldsPage /> },
          { path: "/spaces/:slug/fields/new", element: <SpaceFieldNewPage /> },
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
