import { createFileRoute } from "@tanstack/react-router"
import { api } from "@spacenote/common/api"
import { NewPageHeader } from "@spacenote/common/components"
import { NoteForm } from "@/components/NoteForm"

export const Route = createFileRoute("/_auth/s/$slug/new")({
  component: NewNotePage,
})

/** New note creation page */
function NewNotePage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <>
      <NewPageHeader breadcrumbs={[{ label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } }, { label: "New Note" }]} />
      <NoteForm space={space} mode="create" />
    </>
  )
}
