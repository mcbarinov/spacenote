import { createBrowserRouter } from "react-router"
import Layout from "./components/layout/Layout"
import LoginPage from "./pages/LoginPage"
import IndexPage from "./pages/IndexPage"
import SpaceNotes from "./pages/notes/SpaceNotes"
import CreateNote from "./pages/notes/CreateNote"
import EditNote from "./pages/notes/EditNote"
import NoteDetail from "./pages/notes/NoteDetail"
import SpacesPage from "./pages/spaces/SpacesPage"
import SpaceFields from "./pages/spaces/SpaceFields"
import AddField from "./pages/spaces/AddField"
import SpaceTemplates from "./pages/spaces/SpaceTemplates"
import SpaceFilters from "./pages/spaces/SpaceFilters"
import CreateFilter from "./pages/spaces/CreateFilter"
import SpaceExport from "./pages/spaces/SpaceExport"
import SpaceImport from "./pages/spaces/SpaceImport"
import { requireAuth } from "./lib/auth"

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: Layout,
    loader: requireAuth,
    children: [
      {
        index: true,
        Component: IndexPage,
      },
      {
        path: "spaces",
        Component: SpacesPage,
      },
      {
        path: "spaces/:spaceId/fields",
        Component: SpaceFields,
      },
      {
        path: "spaces/:spaceId/fields/new",
        Component: AddField,
      },
      {
        path: "spaces/:spaceId/templates",
        Component: SpaceTemplates,
      },
      {
        path: "spaces/:spaceId/filters",
        Component: SpaceFilters,
      },
      {
        path: "spaces/:spaceId/filters/create",
        Component: CreateFilter,
      },
      {
        path: "spaces/:spaceId/export",
        Component: SpaceExport,
      },
      {
        path: "spaces/import",
        Component: SpaceImport,
      },
      {
        path: "notes/:spaceId",
        Component: SpaceNotes,
      },
      {
        path: "notes/:spaceId/new",
        Component: CreateNote,
      },
      {
        path: "notes/:spaceId/:noteId/edit",
        Component: EditNote,
      },
      {
        path: "notes/:spaceId/:noteId",
        Component: NoteDetail,
      },
    ],
  },
])
