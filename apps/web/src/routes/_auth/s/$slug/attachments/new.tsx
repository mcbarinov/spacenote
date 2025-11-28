import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button, Paper, Title, Stack, Group, FileInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, LinkButton } from "@spacenote/common/components"

export const Route = createFileRoute("/_auth/s/$slug/attachments/new")({
  component: UploadAttachmentPage,
})

function UploadAttachmentPage() {
  const navigate = useNavigate()
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const uploadMutation = api.mutations.useUploadSpaceAttachment(slug)
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
        void navigate({ to: "/s/$slug/attachments", params: { slug } })
      },
    })
  }

  return (
    <>
      <Title order={1} mb="md">
        {space.title} - Upload Attachment
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
              <LinkButton to="/s/$slug/attachments" params={{ slug }} variant="subtle">
                Cancel
              </LinkButton>
            </Group>
          </Stack>
        </form>
      </Paper>
    </>
  )
}
