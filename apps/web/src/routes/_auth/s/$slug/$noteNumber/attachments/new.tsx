import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button, Group, Paper, Stack, FileInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, PageHeader } from "@spacenote/common/components"
import { useSuspenseQuery } from "@tanstack/react-query"

export const Route = createFileRoute("/_auth/s/$slug/$noteNumber/attachments/new")({
  loader: async ({ context, params }) => {
    const noteNumber = Number(params.noteNumber)
    await context.queryClient.ensureQueryData(api.queries.getNote(params.slug, noteNumber))
  },
  component: UploadNoteAttachmentPage,
})

/** Upload attachment to note page */
function UploadNoteAttachmentPage() {
  const navigate = useNavigate()
  const { slug, noteNumber } = Route.useParams()
  const noteNum = Number(noteNumber)
  const space = api.cache.useSpace(slug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(slug, noteNum))
  const uploadMutation = api.mutations.useUploadNoteAttachment(slug, noteNum)
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
        void navigate({ to: "/s/$slug/$noteNumber/attachments", params: { slug, noteNumber } })
      },
    })
  }

  return (
    <>
      <PageHeader
        title={`Upload: ${note.title}`}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } },
          { label: `Note #${noteNumber}`, to: "/s/$slug/$noteNumber", params: { slug, noteNumber } },
          { label: "Attachments", to: "/s/$slug/$noteNumber/attachments", params: { slug, noteNumber } },
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
