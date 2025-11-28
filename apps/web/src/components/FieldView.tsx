import { Badge, Box, Group, Image, Stack, Text } from "@mantine/core"
import type { FieldType, SpaceField } from "@spacenote/common/types"
import { formatDate } from "@spacenote/common/utils"
import { MarkdownDisplay } from "./MarkdownDisplay"

type FieldValue = string | boolean | string[] | number | null | undefined

interface NoteContext {
  slug: string
  noteNumber: number
}

interface FieldViewProps {
  field: SpaceField
  value: FieldValue
  noteContext?: NoteContext
}

const FULL_WIDTH_TYPES: FieldType[] = ["markdown", "image"]

function isFullWidth(type: FieldType): boolean {
  return FULL_WIDTH_TYPES.includes(type)
}

function formatValue(field: SpaceField, value: FieldValue, noteContext?: NoteContext): React.ReactNode {
  if (value === null || value === undefined) {
    return <Text c="dimmed">—</Text>
  }

  switch (field.type) {
    case "string":
    case "int":
    case "float":
      return <Text>{String(value)}</Text>

    case "boolean":
      return <Badge color={value ? "green" : "gray"}>{value ? "Yes" : "No"}</Badge>

    case "select":
      return <Badge>{String(value)}</Badge>

    case "tags":
      if (!Array.isArray(value) || value.length === 0) {
        return <Text c="dimmed">—</Text>
      }
      return (
        <Group gap="xs">
          {value.map((tag) => (
            <Badge key={tag} variant="light">
              {tag}
            </Badge>
          ))}
        </Group>
      )

    case "user":
      return <Text>{String(value)}</Text>

    case "datetime":
      return <Text>{formatDate(String(value))}</Text>

    case "markdown":
      return <MarkdownDisplay content={String(value)} />

    case "image": {
      if (!noteContext) {
        return <Text c="dimmed">—</Text>
      }
      const imageUrl = `/api/v1/spaces/${noteContext.slug}/notes/${String(noteContext.noteNumber)}/images/${field.name}`
      return <Image src={imageUrl} maw={400} radius="sm" />
    }

    default:
      return <Text>{String(value)}</Text>
  }
}

export function FieldView({ field, value, noteContext }: FieldViewProps) {
  const fullWidth = isFullWidth(field.type)

  if (fullWidth) {
    return (
      <Stack gap="xs">
        <Text fw={500} c="dimmed" size="sm">
          {field.name}
        </Text>
        <Box>{formatValue(field, value, noteContext)}</Box>
      </Stack>
    )
  }

  return (
    <Group>
      <Text fw={500} c="dimmed" size="sm" w={120}>
        {field.name}
      </Text>
      {formatValue(field, value, noteContext)}
    </Group>
  )
}
