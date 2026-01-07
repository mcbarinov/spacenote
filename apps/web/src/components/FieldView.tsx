import { Box, Group, Stack, Text } from "@mantine/core"
import { MultilineText, RetryableImage, TextBadge, Username } from "@spacenote/common/components"
import type { DatetimeFieldOptions, SpaceField, StringFieldOptions } from "@spacenote/common/types"
import { formatDatetime } from "@spacenote/common/utils"
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

/** Checks if field type requires full-width layout (markdown and image need more space) */
function isFullWidth(field: SpaceField): boolean {
  if (field.type === "image") return true
  if (field.type === "string" && (field.options as StringFieldOptions).kind === "markdown") return true
  return false
}

/** Formats field value for display based on field type */
function formatValue(field: SpaceField, value: FieldValue, noteContext?: NoteContext): React.ReactNode {
  if (value == null) {
    return <Text c="dimmed">—</Text>
  }

  switch (field.type) {
    case "string": {
      const opts = field.options as StringFieldOptions
      if (opts.kind === "markdown") {
        return <MarkdownDisplay content={String(value)} />
      }
      if (opts.kind === "text") {
        return <MultilineText>{String(value)}</MultilineText>
      }
      return <Text>{String(value)}</Text>
    }

    case "numeric":
      return <Text>{String(value)}</Text>

    case "boolean":
      return <TextBadge color={value ? "green" : "gray"}>{value ? "Yes" : "No"}</TextBadge>

    case "select":
      return <TextBadge>{String(value)}</TextBadge>

    case "tags":
      if (!Array.isArray(value) || value.length === 0) {
        return <Text c="dimmed">—</Text>
      }
      return (
        <Group gap="xs">
          {value.map((tag) => (
            <TextBadge key={tag} variant="light">
              {tag}
            </TextBadge>
          ))}
        </Group>
      )

    case "user":
      return <Username username={String(value)} />

    case "datetime": {
      const opts = field.options as DatetimeFieldOptions
      return <Text>{formatDatetime(String(value), opts.kind)}</Text>
    }

    case "image": {
      if (!noteContext) {
        return <Text c="dimmed">—</Text>
      }
      const imageUrl = `/api/v1/spaces/${noteContext.slug}/notes/${noteContext.noteNumber}/images/${field.name}`
      return <RetryableImage src={imageUrl} maw={400} radius="sm" />
    }

    default:
      return <Text>{String(value)}</Text>
  }
}

/** Displays field value in read-only mode with appropriate formatting */
export function FieldView({ field, value, noteContext }: FieldViewProps) {
  const fullWidth = isFullWidth(field)

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
