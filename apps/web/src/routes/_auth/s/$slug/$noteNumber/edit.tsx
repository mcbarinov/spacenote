import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router"
import { Button, Group } from "@mantine/core"
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
  const location = useLocation()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(slug, Number(noteNumber)))

  const isNoteAttachments = location.pathname.includes(`/${noteNumber}/attachments`)
  const isEdit = location.pathname.includes(`/${noteNumber}/edit`)

  return (
    <>
      <PageHeader
        title={`Edit Note #${String(note.number)}`}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } },
          { label: `Note #${String(note.number)}` },
        ]}
        topActions={
          <Group gap="xs">
            <Button
              variant={!isNoteAttachments && !isEdit ? "light" : "subtle"}
              size="xs"
              onClick={() => void navigate({ to: "/s/$slug/$noteNumber", params: { slug, noteNumber } })}
            >
              Notes
            </Button>
            <Button
              variant={isNoteAttachments ? "light" : "subtle"}
              size="xs"
              onClick={() => void navigate({ to: "/s/$slug/$noteNumber/attachments", params: { slug, noteNumber } })}
            >
              Note Attachments
            </Button>
            <Button
              variant={isEdit ? "light" : "subtle"}
              size="xs"
              onClick={() => void navigate({ to: "/s/$slug/$noteNumber/edit", params: { slug, noteNumber } })}
            >
              Edit
            </Button>
          </Group>
        }
      />
      <NoteForm space={space} mode="edit" note={note} />
    </>
  )
}
