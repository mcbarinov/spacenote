import { createBrowserRouter, Outlet } from "react-router"
import { AuthProvider } from "@/contexts/auth"
import AuthLayout from "@/components/layout/AuthLayout"
import HomePage from "@/components/pages/HomePage"
import LoginPage from "@/components/pages/LoginPage"
import CreateSpace from "@/components/pages/spaces/CreateSpace"
import FieldList from "@/components/pages/spaces/fields/FieldList"
import CreateField from "@/components/pages/spaces/fields/CreateField"
import MemberList from "@/components/pages/spaces/members/MemberList"
import FilterList from "@/components/pages/spaces/filters/FilterList"
import TemplateList from "@/components/pages/spaces/templates/TemplateList"
import SpaceSettings from "@/components/pages/spaces/settings/SpaceSettings"
import NoteList from "@/components/pages/notes/NoteList"
import NoteDetail from "@/components/pages/notes/detail/NoteDetail"
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
          { path: "/s/:slug/:number", element: <NoteDetail /> },
          { path: "/s/:slug/new", element: <CreateNote /> },
          { path: "/spaces/new", element: <CreateSpace /> },
          { path: "/spaces/:slug/members", element: <MemberList /> },
          { path: "/spaces/:slug/fields", element: <FieldList /> },
          { path: "/spaces/:slug/fields/new", element: <CreateField /> },
          { path: "/spaces/:slug/filters", element: <FilterList /> },
          { path: "/spaces/:slug/templates", element: <TemplateList /> },
          { path: "/spaces/:slug/settings", element: <SpaceSettings /> },
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
