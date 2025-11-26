import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Group, Table, Title } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { LinkButton } from "@spacenote/common/components"

export const Route = createFileRoute("/_auth/s/$slug/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(api.queries.listNotes(params.slug))
  },
  component: SpacePage,
})

function SpacePage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(slug))

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={1}>{space.title}</Title>
        <LinkButton to="/s/$slug/new" params={{ slug }}>
          New Note
        </LinkButton>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Number</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Author</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {notesList.items.map((note) => (
            <Table.Tr
              key={note.number}
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate({
                  to: "/s/$slug/$noteNumber",
                  params: { slug, noteNumber: String(note.number) },
                })
              }
            >
              <Table.Td>{note.number}</Table.Td>
              <Table.Td>{new Date(note.created_at).toLocaleString()}</Table.Td>
              <Table.Td>{note.author}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  )
}
