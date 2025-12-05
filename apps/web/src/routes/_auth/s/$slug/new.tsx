import { createFileRoute } from "@tanstack/react-router"
import { api } from "@spacenote/common/api"
import { NoteForm } from "@/components/NoteForm"
import { SpaceHeader } from "@/components/SpaceHeader"

export const Route = createFileRoute("/_auth/s/$slug/new")({
  component: NewNotePage,
})

/** New note creation page */
function NewNotePage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <>
      <SpaceHeader space={space} title="New Note" />
      <NoteForm space={space} mode="create" />
    </>
  )
}
