import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button, Group, Paper, Stack, FileInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, PageHeader } from "@spacenote/common/components"

export const Route = createFileRoute("/_auth/s/$slug/$noteNumber/attachments/new")({
  component: UploadNoteAttachmentPage,
})

/** Upload attachment to note page */
function UploadNoteAttachmentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { slug, noteNumber } = Route.useParams()
  const noteNum = Number(noteNumber)
  const space = api.cache.useSpace(slug)
  const uploadMutation = api.mutations.useUploadNoteAttachment(slug, noteNum)
  const [file, setFile] = useState<File | null>(null)

  const isNoteAttachments = location.pathname.includes(`/${noteNumber}/attachments`)
  const isEdit = location.pathname.includes(`/${noteNumber}/edit`)

  /** Uploads file and navigates to attachments list on success */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    uploadMutation.mutate(file, {
      onSuccess: () => {
        notifications.show({
          message: "File uploaded",
          color: "green",
        })
        void navigate({ to: "/s/$slug/$noteNumber/attachments", params: { slug, noteNumber } })
      },
    })
  }

  return (
    <>
      <PageHeader
        title={`Note #${noteNumber} Upload Attachment`}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } },
          { label: `Note #${noteNumber}` },
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
      <Paper withBorder p="xl">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <FileInput label="File" placeholder="Select file" value={file} onChange={setFile} required />
            {uploadMutation.error && <ErrorMessage error={uploadMutation.error} />}
            <Group justify="flex-end">
              <Button type="submit" loading={uploadMutation.isPending} disabled={!file}>
                Upload
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </>
  )
}
