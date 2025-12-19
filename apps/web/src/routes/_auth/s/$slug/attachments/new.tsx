import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button, Group, Paper, Stack, FileInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, PageHeader } from "@spacenote/common/components"

export const Route = createFileRoute("/_auth/s/$slug/attachments/new")({
  component: UploadAttachmentPage,
})

/** Upload attachment to space page */
function UploadAttachmentPage() {
  const navigate = useNavigate()
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const uploadMutation = api.mutations.useUploadSpaceAttachment(slug)
  const [file, setFile] = useState<File | null>(null)

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
        void navigate({ to: "/s/$slug/attachments", params: { slug } })
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Upload Attachment"
        breadcrumbs={[
          { label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } },
          { label: "Attachments", to: "/s/$slug/attachments", params: { slug } },
          { label: "Upload" },
        ]}
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
