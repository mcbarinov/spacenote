import { createFileRoute } from "@tanstack/react-router"
import { ActionIcon, Group, Table, Title, Text } from "@mantine/core"
import { IconDownload } from "@tabler/icons-react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { LinkButton } from "@spacenote/common/components"

export const Route = createFileRoute("/_auth/s/$slug/$noteNumber/attachments/")({
  loader: async ({ context, params }) => {
    const noteNumber = Number(params.noteNumber)
    await context.queryClient.ensureQueryData(api.queries.listNoteAttachments(params.slug, noteNumber))
  },
  component: NoteAttachmentsPage,
})

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function NoteAttachmentsPage() {
  const { slug, noteNumber } = Route.useParams()
  const noteNum = Number(noteNumber)
  const { data: attachments } = useSuspenseQuery(api.queries.listNoteAttachments(slug, noteNum))

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={1}>Note #{noteNumber} - Attachments</Title>
        <Group>
          <LinkButton to="/s/$slug/$noteNumber/attachments/new" params={{ slug, noteNumber }}>
            Upload
          </LinkButton>
          <LinkButton to="/s/$slug/$noteNumber" params={{ slug, noteNumber }} variant="light">
            Back
          </LinkButton>
        </Group>
      </Group>

      {attachments.length === 0 ? (
        <Text c="dimmed">No attachments yet</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Filename</Table.Th>
              <Table.Th>Size</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Author</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {attachments.map((attachment) => (
              <Table.Tr key={attachment.number}>
                <Table.Td>{attachment.number}</Table.Td>
                <Table.Td>{attachment.filename}</Table.Td>
                <Table.Td>{formatFileSize(attachment.size)}</Table.Td>
                <Table.Td>{attachment.mime_type}</Table.Td>
                <Table.Td>{attachment.author}</Table.Td>
                <Table.Td>{new Date(attachment.created_at).toLocaleString()}</Table.Td>
                <Table.Td>
                  <ActionIcon
                    component="a"
                    href={`/api/v1/spaces/${slug}/notes/${noteNumber}/attachments/${String(attachment.number)}`}
                    variant="subtle"
                  >
                    <IconDownload size={18} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </>
  )
}
