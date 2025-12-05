import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
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
  const navigate = useNavigate()
  const { slug, noteNumber } = Route.useParams()
  const noteNum = Number(noteNumber)
  const space = api.cache.useSpace(slug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(slug, noteNum))
  const updateNoteMutation = api.mutations.useUpdateNote(slug, noteNum)

  const handleSuccess = () => {
    notifications.show({ message: "Note updated", color: "green" })
    void navigate({ to: "/s/$slug/$noteNumber", params: { slug, noteNumber } })
  }

  return (
    <>
      <SpaceHeader space={space} note={{ number: note.number }} title={`Edit Note #${String(note.number)}`} />
      <NoteForm
        space={space}
        initialValues={note.fields}
        mutation={updateNoteMutation}
        submitLabel="Save"
        onSuccess={handleSuccess}
      />
    </>
  )
}
