import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router"
import { Button, Group } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
import { NoteForm } from "@/components/NoteForm"

export const Route = createFileRoute("/_auth/s/$slug/new")({
  component: NewNotePage,
})

/** New note creation page */
function NewNotePage() {
  const { slug } = Route.useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)

  const isSpaceAttachments =
    location.pathname === `/s/${slug}/attachments` || location.pathname.startsWith(`/s/${slug}/attachments/`)

  return (
    <>
      <PageHeader
        title="New Note"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: `◈ ${space.slug}` }]}
        topActions={
          <Group gap="xs">
            <Button
              variant={!isSpaceAttachments ? "light" : "subtle"}
              size="xs"
              onClick={() => void navigate({ to: "/s/$slug", params: { slug } })}
            >
              Notes
            </Button>
            <Button
              variant={isSpaceAttachments ? "light" : "subtle"}
              size="xs"
              onClick={() => void navigate({ to: "/s/$slug/attachments", params: { slug } })}
            >
              Space Attachments
            </Button>
          </Group>
        }
      />
      <NoteForm space={space} mode="create" />
    </>
  )
}
