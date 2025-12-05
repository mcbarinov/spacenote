import { Table } from "@mantine/core"
import { useNavigate } from "@tanstack/react-router"
import type { Note, Space, SpaceField } from "@spacenote/common/types"
import { formatDate } from "@spacenote/common/utils"

interface NotesListDefaultProps {
  notes: Note[]
  space: Space
  displayFields: string[]
}

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

/** Default table view for notes list */
export function NotesListDefault({ notes, space, displayFields }: NotesListDefaultProps) {
  const navigate = useNavigate()

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          {displayFields.map((field) => (
            <Table.Th key={field}>{getFieldLabel(field, space.fields)}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {notes.map((note) => (
          <Table.Tr
            key={note.number}
            style={{ cursor: "pointer" }}
            onClick={() =>
              navigate({
                to: "/s/$slug/$noteNumber",
                params: { slug: space.slug, noteNumber: String(note.number) },
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
  )
}
