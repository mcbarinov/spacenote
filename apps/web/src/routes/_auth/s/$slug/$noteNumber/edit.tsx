import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { NoteForm } from "@/components/NoteForm"
import { SpaceHeader } from "@/components/SpaceHeader"

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
      <SpaceHeader space={space} note={{ number: note.number }} title={`Edit Note #${String(note.number)}`} />
      <NoteForm space={space} mode="edit" note={note} />
    </>
  )
}
