import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Select, Table } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import type { Note, SpaceField } from "@spacenote/common/types"
import { formatDate } from "@spacenote/common/utils"
import { z } from "zod"
import { SpaceHeader } from "@/components/SpaceHeader"

const searchSchema = z.object({
  filter: z.string().optional(),
})

// Labels for system fields (note.number, etc.) vs custom fields (note.fields.*)
const SYSTEM_FIELD_LABELS: Record<string, string> = {
  "note.number": "Number",
  "note.created_at": "Created",
  "note.author": "Author",
}

/** Gets display label for field column */
function getFieldLabel(field: string, spaceFields: SpaceField[]): string {
  if (field in SYSTEM_FIELD_LABELS) {
    return SYSTEM_FIELD_LABELS[field]
  }
  const fieldName = field.startsWith("note.fields.") ? field.slice("note.fields.".length) : field
  return spaceFields.find((f) => f.name === fieldName)?.name ?? fieldName
}

/** Renders field value for table cell */
function renderFieldValue(field: string, note: Note): React.ReactNode {
  if (field === "note.number") return note.number
  if (field === "note.created_at") return formatDate(note.created_at)
  if (field === "note.author") return note.author

  const fieldName = field.startsWith("note.fields.") ? field.slice("note.fields.".length) : field
  const value = note.fields[fieldName]
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

/** Space page with notes table */
function SpacePage() {
  const { slug } = Route.useParams()
  const { filter } = Route.useSearch()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(slug, filter))

  // Column priority: selected filter > "all" filter > hardcoded defaults
  const selectedFilter = filter ? space.filters.find((f) => f.name === filter) : undefined
  const allFilter = space.filters.find((f) => f.name === "all")
  const displayFields = selectedFilter?.notes_list_default_columns.length
    ? selectedFilter.notes_list_default_columns
    : allFilter?.notes_list_default_columns.length
      ? allFilter.notes_list_default_columns
      : ["note.number", "note.created_at", "note.author"]

  return (
    <>
      <SpaceHeader
        space={space}
        title={space.title}
        actions={
          space.filters.length > 0 ? (
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
          ) : undefined
        }
        nav={[{ label: "New Note", to: "/s/$slug/new", params: { slug } }]}
      />

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
