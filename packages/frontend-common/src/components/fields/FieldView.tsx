import { Badge, Box, Group, Stack, Text } from "@mantine/core"
import type { FieldType, SpaceField } from "../../types"

type FieldValue = string | boolean | string[] | number | null | undefined

interface FieldViewProps {
  field: SpaceField
  value: FieldValue
}

const FULL_WIDTH_TYPES: FieldType[] = ["markdown", "image"]

function isFullWidth(type: FieldType): boolean {
  return FULL_WIDTH_TYPES.includes(type)
}

function formatValue(type: FieldType, value: FieldValue): React.ReactNode {
  if (value === null || value === undefined) {
    return <Text c="dimmed">—</Text>
  }

  switch (type) {
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
      return <Text>{new Date(String(value)).toLocaleString()}</Text>

    case "markdown":
      return <Text style={{ whiteSpace: "pre-wrap" }}>{String(value)}</Text>

    case "image":
      return <Text c="dimmed">Image display not implemented</Text>

    default:
      return <Text>{String(value)}</Text>
  }
}

export function FieldView({ field, value }: FieldViewProps) {
  const fullWidth = isFullWidth(field.type)

  if (fullWidth) {
    return (
      <Stack gap="xs">
        <Text fw={500} c="dimmed" size="sm">
          {field.name}
        </Text>
        <Box>{formatValue(field.type, value)}</Box>
      </Stack>
    )
  }

  return (
    <Group>
      <Text fw={500} c="dimmed" size="sm" w={120}>
        {field.name}
      </Text>
      {formatValue(field.type, value)}
    </Group>
  )
}
