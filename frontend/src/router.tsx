import { createBrowserRouter, Outlet } from "react-router"
import { AuthProvider } from "@/contexts/auth"
import AuthLayout from "@/components/layout/AuthLayout"
import HomePage from "@/components/pages/HomePage"
import LoginPage from "@/components/pages/LoginPage"
import SpaceList from "@/components/pages/spaces/SpaceList"
import CreateSpace from "@/components/pages/spaces/CreateSpace"
import FieldList from "@/components/pages/spaces/fields/FieldList"
import CreateField from "@/components/pages/spaces/fields/CreateField"
import NoteList from "@/components/pages/notes/NoteList"
import CreateNote from "@/components/pages/notes/CreateNote"

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
          { path: "/s/:slug", element: <NoteList /> },
          { path: "/s/:slug/new", element: <CreateNote /> },
          { path: "/spaces", element: <SpaceList /> },
          { path: "/spaces/new", element: <CreateSpace /> },
          { path: "/spaces/:slug/fields", element: <FieldList /> },
          { path: "/spaces/:slug/fields/new", element: <CreateField /> },
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
