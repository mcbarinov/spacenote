import { createFileRoute } from "@tanstack/react-router"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
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
      <PageHeader
        title="New Note"
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } },
        ]}
      />
      <NoteForm space={space} mode="create" />
    </>
  )
}
