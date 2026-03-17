import { Group, Table } from "@mantine/core"
import { useNavigate } from "@tanstack/react-router"
import { TextBadge } from "@/components/TextBadge"
import { Username } from "@/components/Username"
import type { Note, Space } from "@/types"
import { getFieldDefinition, getFieldDisplayName } from "@/utils/filters"
import { formatDate } from "@/utils/format"
import { getRecurrenceStatus, RECURRENCE_STATUS_CONFIG } from "@/utils/recurrence"

interface NotesListDefaultProps {
  notes: Note[]
  space: Space
  filter?: string
}

const SYSTEM_FIELD_LABELS: Record<string, string> = {
  "note.number": "Number",
  "note.created_at": "Created",
  "note.edited_at": "Edited",
  "note.activity_at": "Activity",
  "note.author": "Author",
  "note.title": "Title",
}

/** Gets display label for field column */
function getFieldLabel(field: string): string {
  if (field in SYSTEM_FIELD_LABELS) {
    return SYSTEM_FIELD_LABELS[field]
  }
  return getFieldDisplayName(field)
}

/** Gets field type for a given field path */
function getFieldType(field: string, space: Space): string | null {
  return getFieldDefinition(field, space.fields)?.type ?? null
}

/** Default table view for notes list */
export function NotesListDefault({ notes, space, filter }: NotesListDefaultProps) {
  const navigate = useNavigate()

  // Column priority: selected filter > "all" filter (allFilter always exists)
  const selectedFilter = filter ? space.filters.find((f) => f.name === filter) : undefined
  const allFilter = space.filters.find((f) => f.name === "all")
  const displayFields = selectedFilter?.default_columns.length
    ? selectedFilter.default_columns
    : (allFilter?.default_columns ?? [])

  /** Renders field value for display */
  function renderFieldValue(field: string, note: Note): React.ReactNode {
    // System fields
    if (field === "note.number") return note.number
    if (field === "note.created_at") return formatDate(note.created_at)
    if (field === "note.edited_at") return note.edited_at ? formatDate(note.edited_at) : ""
    if (field === "note.activity_at") return formatDate(note.activity_at)
    if (field === "note.title") return note.title
    if (field === "note.author") return <Username username={note.author} />

    const fieldName = getFieldDisplayName(field)
    const fieldType = getFieldType(field, space)
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
        <TextBadge variant="light" style={{ textTransform: "none" }}>
          {value}
        </TextBadge>
      )
    }

    // Recurrence field - display status badge
    if (fieldType === "recurrence" && typeof value === "object" && "interval" in value) {
      const status = getRecurrenceStatus(value)
      const config = RECURRENCE_STATUS_CONFIG[status]
      return (
        <TextBadge color={config.color} variant="light">
          {config.label}
        </TextBadge>
      )
    }

    // Other fields
    if (Array.isArray(value)) return value.join(", ")
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (typeof value === "object") return ""
    return String(value)
  }

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          {displayFields.map((field) => (
            <Table.Th key={field}>{getFieldLabel(field)}</Table.Th>
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
