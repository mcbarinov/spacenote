import { Badge, Group, Table, Tooltip } from "@mantine/core"
import { useNavigate } from "@tanstack/react-router"
import type { FieldType, Note, Space, SpaceField } from "@spacenote/common/types"
import { formatDate } from "@spacenote/common/utils"

interface NotesListDefaultProps {
  notes: Note[]
  space: Space
  displayFields: string[]
  q?: string
}

const SYSTEM_FIELD_LABELS: Record<string, string> = {
  "note.number": "Number",
  "note.created_at": "Created",
  "note.edited_at": "Edited",
  "note.activity_at": "Activity",
  "note.author": "Author",
  "note.title": "Title",
}

/** Operators for clickable field types */
const CLICKABLE_OPERATORS: Partial<Record<FieldType, string>> = {
  user: "eq",
  select: "eq",
  tags: "in",
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

/** System fields that are not clickable/filterable */
const NON_CLICKABLE_SYSTEM_FIELDS = ["note.number", "note.created_at", "note.edited_at", "note.activity_at", "note.title"]

/** Gets field type for a given field path */
function getFieldType(field: string, spaceFields: SpaceField[]): FieldType | null {
  if (field === "note.author") return "user"
  if (NON_CLICKABLE_SYSTEM_FIELDS.includes(field)) return null
  const fieldName = getFieldName(field)
  return spaceFields.find((f) => f.name === fieldName)?.type ?? null
}

interface ClickableValueProps {
  tooltip: string
  onClick: (e: React.MouseEvent | React.KeyboardEvent) => void
  children: React.ReactNode
}

/** Clickable span with tooltip and keyboard support */
function ClickableValue({ tooltip, onClick, children }: ClickableValueProps) {
  return (
    <Tooltip label={tooltip}>
      <span
        role="button"
        tabIndex={0}
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation()
          onClick(e)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            e.stopPropagation()
            onClick(e)
          }
        }}
      >
        {children}
      </span>
    </Tooltip>
  )
}

/** Default table view for notes list */
export function NotesListDefault({ notes, space, displayFields, q }: NotesListDefaultProps) {
  const navigate = useNavigate()

  /** Navigates with new filter condition */
  function addFilter(field: string, value: string) {
    const fieldType = getFieldType(field, space.fields)
    if (!fieldType) return
    const operator = CLICKABLE_OPERATORS[fieldType]
    if (!operator) return

    const condition = `${field}:${operator}:${value}`
    const newQ = q ? `${q},${condition}` : condition

    void navigate({
      to: "/s/$slug",
      params: { slug: space.slug },
      search: (prev) => ({ ...prev, q: newQ }),
    })
  }

  /** Renders field value, making it clickable if applicable */
  function renderFieldValue(field: string, note: Note): React.ReactNode {
    // System fields - access directly from note object
    if (field === "note.number") return note.number
    if (field === "note.created_at") return formatDate(note.created_at)
    if (field === "note.edited_at") return note.edited_at ? formatDate(note.edited_at) : ""
    if (field === "note.activity_at") return formatDate(note.activity_at)
    if (field === "note.title") return note.title

    const fieldName = getFieldName(field)
    const fieldType = getFieldType(field, space.fields)

    // System author field (clickable)
    if (field === "note.author") {
      return (
        <ClickableValue
          tooltip={`Click to filter by ${fieldName}: ${note.author}`}
          onClick={() => {
            addFilter(field, note.author)
          }}
        >
          👤{note.author}
        </ClickableValue>
      )
    }

    const value = note.fields[fieldName]
    if (value == null) return ""

    // Tags - each tag as clickable #hashtag
    if (fieldType === "tags" && Array.isArray(value)) {
      if (value.length === 0) return ""
      return (
        <Group gap={8}>
          {value.map((tag) => (
            <ClickableValue
              key={tag}
              tooltip={`Click to filter by ${fieldName}: ${tag}`}
              onClick={() => {
                addFilter(field, tag)
              }}
            >
              #{tag}
            </ClickableValue>
          ))}
        </Group>
      )
    }

    // User field - clickable with icon
    if (fieldType === "user" && typeof value === "string") {
      return (
        <ClickableValue
          tooltip={`Click to filter by ${fieldName}: ${value}`}
          onClick={() => {
            addFilter(field, value)
          }}
        >
          👤{value}
        </ClickableValue>
      )
    }

    // Select field - clickable badge
    if (fieldType === "select" && typeof value === "string") {
      return (
        <Tooltip label={`Click to filter by ${fieldName}: ${value}`}>
          <Badge
            variant="light"
            style={{ cursor: "pointer", textTransform: "none" }}
            onClick={(e) => {
              e.stopPropagation()
              addFilter(field, value)
            }}
          >
            {value}
          </Badge>
        </Tooltip>
      )
    }

    // Non-clickable fields
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
