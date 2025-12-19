import { Badge, Group, Table } from "@mantine/core"
import { useNavigate } from "@tanstack/react-router"
import { Username } from "@spacenote/common/components"
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
  "note.edited_at": "Edited",
  "note.activity_at": "Activity",
  "note.author": "Author",
  "note.title": "Title",
}

/** Extracts field name from field path */
function getFieldName(field: string): string {
  if (field.startsWith("note.fields.")) return field.slice("note.fields.".length)
  if (field.startsWith("note.")) return field.slice("note.".length)
  return field
}

/** Gets display label for field column */
function getFieldLabel(field: string, spaceFields: SpaceField[]): string {
  if (field in SYSTEM_FIELD_LABELS) {
    return SYSTEM_FIELD_LABELS[field]
  }
  const fieldName = getFieldName(field)
  return spaceFields.find((f) => f.name === fieldName)?.name ?? fieldName
}

/** Gets field type for a given field path */
function getFieldType(field: string, spaceFields: SpaceField[]): string | null {
  if (field === "note.author") return "user"
  if (field.startsWith("note.fields.")) {
    const fieldName = field.slice("note.fields.".length)
    return spaceFields.find((f) => f.name === fieldName)?.type ?? null
  }
  return null
}

/** Default table view for notes list */
export function NotesListDefault({ notes, space, displayFields }: NotesListDefaultProps) {
  const navigate = useNavigate()

  /** Renders field value for display */
  function renderFieldValue(field: string, note: Note): React.ReactNode {
    // System fields
    if (field === "note.number") return note.number
    if (field === "note.created_at") return formatDate(note.created_at)
    if (field === "note.edited_at") return note.edited_at ? formatDate(note.edited_at) : ""
    if (field === "note.activity_at") return formatDate(note.activity_at)
    if (field === "note.title") return note.title
    if (field === "note.author") return <Username username={note.author} />

    const fieldName = getFieldName(field)
    const fieldType = getFieldType(field, space.fields)
    const value = note.fields[fieldName]

    if (value == null) return ""

    // Tags - display as hashtags
    if (fieldType === "tags" && Array.isArray(value)) {
      if (value.length === 0) return ""
      return (
        <Group gap={8}>
          {value.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </Group>
      )
    }

    // User field - display with icon
    if (fieldType === "user" && typeof value === "string") {
      return <Username username={value} />
    }

    // Select field - display as badge
    if (fieldType === "select" && typeof value === "string") {
      return (
        <Badge variant="light" style={{ textTransform: "none" }}>
          {value}
        </Badge>
      )
    }

    // Other fields
    if (Array.isArray(value)) return value.join(", ")
    if (typeof value === "boolean") return value ? "Yes" : "No"
    return String(value)
  }

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
              void navigate({
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
