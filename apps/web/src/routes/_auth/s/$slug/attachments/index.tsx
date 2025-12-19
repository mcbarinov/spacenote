import { createFileRoute } from "@tanstack/react-router"
import { ActionIcon, Table, Text } from "@mantine/core"
import { IconDownload } from "@tabler/icons-react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { LinkButton, NewPageHeader } from "@spacenote/common/components"
import { formatDate, formatFileSize } from "@spacenote/common/utils"
import { MetaCell } from "@/components/MetaCell"

export const Route = createFileRoute("/_auth/s/$slug/attachments/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(api.queries.listSpaceAttachments(params.slug))
  },
  component: AttachmentsPage,
})

/** Space attachments list page */
function AttachmentsPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const { data: attachments } = useSuspenseQuery(api.queries.listSpaceAttachments(slug))

  return (
    <>
      <NewPageHeader
        breadcrumbs={[{ label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } }, { label: "Attachments" }]}
        topActions={
          <LinkButton to="/s/$slug/attachments/new" params={{ slug }}>
            Upload
          </LinkButton>
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
                    href={`/api/v1/spaces/${slug}/attachments/${String(attachment.number)}`}
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
