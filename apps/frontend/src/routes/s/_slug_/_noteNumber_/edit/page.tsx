import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { NoteForm } from "@/components/NoteForm"
import { TransferNoteButton } from "./-local/TransferNoteButton"

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
        breadcrumbs={[
          { label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } },
          { label: `Note #${note.number}`, to: "/s/$slug/$noteNumber", params: { slug, noteNumber } },
          { label: "Edit" },
        ]}
        topActions={<TransferNoteButton space={space} noteNumber={Number(noteNumber)} />}
      />
      <NoteForm space={space} mode="edit" note={note} />
    </>
  )
}
