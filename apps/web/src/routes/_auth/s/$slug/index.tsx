import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Group, Select, Table, Title } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { LinkButton } from "@spacenote/common/components"
import type { Note, SpaceField } from "@spacenote/common/types"
import { formatDate } from "@spacenote/common/utils"
import { z } from "zod"

const searchSchema = z.object({
  filter: z.string().optional(),
})

const SYSTEM_FIELD_LABELS: Record<string, string> = {
  "note.number": "Number",
  "note.created_at": "Created",
  "note.author": "Author",
}

function getFieldLabel(field: string, spaceFields: SpaceField[]): string {
  if (field.startsWith("note.")) {
    return SYSTEM_FIELD_LABELS[field] ?? field
  }
  return spaceFields.find((f) => f.name === field)?.name ?? field
}

function renderFieldValue(field: string, note: Note): React.ReactNode {
  if (field === "note.number") return note.number
  if (field === "note.created_at") return formatDate(note.created_at)
  if (field === "note.author") return note.author

  const value = note.fields[field]
  if (value == null) return ""
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

export const Route = createFileRoute("/_auth/s/$slug/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ filter: search.filter }),
  loader: async ({ context, params, deps }) => {
    await context.queryClient.ensureQueryData(api.queries.listNotes(params.slug, deps.filter))
  },
  component: SpacePage,
})

function SpacePage() {
  const { slug } = Route.useParams()
  const { filter } = Route.useSearch()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(slug, filter))

  const selectedFilter = filter ? space.filters.find((f) => f.name === filter) : undefined
  const displayFields = selectedFilter?.display_fields ?? ["note.number", "note.created_at", "note.author"]

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={1}>{space.title}</Title>
        <Group>
          {space.filters.length > 0 && (
            <Select
              placeholder="All notes"
              clearable
              data={space.filters.map((f) => ({ value: f.name, label: f.name }))}
              value={filter ?? null}
              onChange={(value) =>
                void navigate({
                  to: "/s/$slug",
                  params: { slug },
                  search: value ? { filter: value } : {},
                })
              }
            />
          )}
          <LinkButton to="/s/$slug/attachments" params={{ slug }} variant="light">
            Attachments
          </LinkButton>
          <LinkButton to="/s/$slug/new" params={{ slug }}>
            New Note
          </LinkButton>
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {displayFields.map((field) => (
              <Table.Th key={field}>{getFieldLabel(field, space.fields)}</Table.Th>
            ))}
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
              {displayFields.map((field) => (
                <Table.Td key={field}>{renderFieldValue(field, note)}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  )
}
