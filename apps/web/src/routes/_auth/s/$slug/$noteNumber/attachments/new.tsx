import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button, Paper, Title, Stack, Group, FileInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, LinkButton } from "@spacenote/common/components"

export const Route = createFileRoute("/_auth/s/$slug/$noteNumber/attachments/new")({
  component: UploadNoteAttachmentPage,
})

function UploadNoteAttachmentPage() {
  const navigate = useNavigate()
  const { slug, noteNumber } = Route.useParams()
  const noteNum = Number(noteNumber)
  const uploadMutation = api.mutations.useUploadNoteAttachment(slug, noteNum)
  const [file, setFile] = useState<File | null>(null)

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
      <Title order={1} mb="md">
        Note #{noteNumber} - Upload Attachment
      </Title>
      <Paper withBorder p="xl">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <FileInput label="File" placeholder="Select file" value={file} onChange={setFile} required />
            {uploadMutation.error && <ErrorMessage error={uploadMutation.error} />}
            <Group>
              <Button type="submit" loading={uploadMutation.isPending} disabled={!file}>
                Upload
              </Button>
              <LinkButton to="/s/$slug/$noteNumber/attachments" params={{ slug, noteNumber }} variant="subtle">
                Cancel
              </LinkButton>
            </Group>
          </Stack>
        </form>
      </Paper>
    </>
  )
}
