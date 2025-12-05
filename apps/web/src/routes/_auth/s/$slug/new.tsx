import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { NoteForm } from "@/components/NoteForm"
import { SpaceHeader } from "@/components/SpaceHeader"

export const Route = createFileRoute("/_auth/s/$slug/new")({
  component: NewNotePage,
})

/** New note creation page */
function NewNotePage() {
  const navigate = useNavigate()
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const createNoteMutation = api.mutations.useCreateNote(slug)

  const handleSuccess = () => {
    notifications.show({ message: "Note created", color: "green" })
    void navigate({ to: "/s/$slug", params: { slug } })
  }

  return (
    <>
      <SpaceHeader space={space} title="New Note" />
      <NoteForm space={space} mutation={createNoteMutation} submitLabel="Create" onSuccess={handleSuccess} />
    </>
  )
}
