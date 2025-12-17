import { createFileRoute } from "@tanstack/react-router"
import { ActionIcon, Code, Group, Table, Text, UnstyledButton } from "@mantine/core"
import { modals } from "@mantine/modals"
import { IconDownload } from "@tabler/icons-react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { LinkButton, NavigationTabs, PageHeader } from "@spacenote/common/components"
import { formatDate, formatFileSize } from "@spacenote/common/utils"

/** Displays meta keys, opens modal with full JSON on click */
function MetaCell({ meta }: { meta: Record<string, unknown> }) {
  const keys = Object.keys(meta)
  if (keys.length === 0) return <Text c="dimmed">-</Text>

  function handleClick() {
    modals.open({
      title: "Metadata",
      size: "lg",
      children: <Code block>{JSON.stringify(meta, null, 2)}</Code>,
    })
  }

  return (
    <UnstyledButton onClick={handleClick}>
      <Text c="blue" td="underline">
        {keys.join(", ")}
      </Text>
    </UnstyledButton>
  )
}

export const Route = createFileRoute("/_auth/s/$slug/$noteNumber/attachments/")({
  loader: async ({ context, params }) => {
    const noteNumber = Number(params.noteNumber)
    await context.queryClient.ensureQueryData(api.queries.listNoteAttachments(params.slug, noteNumber))
    await context.queryClient.ensureQueryData(api.queries.getNote(params.slug, noteNumber))
  },
  component: NoteAttachmentsPage,
})

/** Note attachments list page */
function NoteAttachmentsPage() {
  const { slug, noteNumber } = Route.useParams()
  const noteNum = Number(noteNumber)
  const space = api.cache.useSpace(slug)
  const { data: attachments } = useSuspenseQuery(api.queries.listNoteAttachments(slug, noteNum))
  const { data: note } = useSuspenseQuery(api.queries.getNote(slug, noteNum))

  return (
    <>
      <PageHeader
        title={`Attachments: ${note.title}`}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } },
          { label: `Note #${noteNumber}` },
        ]}
        topActions={
          <Group gap="sm">
            <NavigationTabs
              tabs={[
                { label: "Note", to: "/s/$slug/$noteNumber", params: { slug, noteNumber } },
                { label: "Attachments", to: "/s/$slug/$noteNumber/attachments", params: { slug, noteNumber } },
              ]}
            />
            <LinkButton to="/s/$slug/$noteNumber/attachments/new" params={{ slug, noteNumber }}>
              Upload
            </LinkButton>
          </Group>
        }
      />

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
              <Table.Th>Meta</Table.Th>
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
                <Table.Td>
                  <MetaCell meta={attachment.meta} />
                </Table.Td>
                <Table.Td>{attachment.author}</Table.Td>
                <Table.Td>{formatDate(attachment.created_at)}</Table.Td>
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
