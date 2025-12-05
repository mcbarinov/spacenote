import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
import { NoteForm } from "@/components/NoteForm"

export const Route = createFileRoute("/_auth/s/$slug/$noteNumber/edit")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(api.queries.getNote(params.slug, Number(params.noteNumber)))
  },
  component: EditNotePage,
})

/** Edit note page */
function EditNotePage() {
  const { slug, noteNumber } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(slug, Number(noteNumber)))

  return (
    <>
      <PageHeader
        title={`Edit Note #${String(note.number)}`}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } },
          { label: `Note #${String(note.number)}`, to: "/s/$slug/$noteNumber", params: { slug, noteNumber } },
        ]}
      />
      <NoteForm space={space} mode="edit" note={note} />
    </>
  )
}
