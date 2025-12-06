import { ActionIcon, Badge, Group } from "@mantine/core"
import { IconX } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"

interface ActiveQueryFiltersProps {
  q: string | undefined
  slug: string
}

interface ParsedCondition {
  field: string
  operator: string
  value: string
}

/** Parses condition string like "note.fields.status:eq:new" */
function parseCondition(condition: string): ParsedCondition {
  const parts = condition.split(":")
  const fieldPath = parts[0]
  const operator = parts[1]
  const value = parts.slice(2).join(":") // Handle values with colons

  const field = fieldPath.startsWith("note.fields.") ? fieldPath.slice("note.fields.".length) : fieldPath.slice("note.".length)

  return { field, operator, value }
}

/** Formats operator for display */
function formatOperator(operator: string): string {
  const operators: Record<string, string> = {
    eq: "=",
    ne: "≠",
    gt: ">",
    gte: "≥",
    lt: "<",
    lte: "≤",
    in: ":",
    nin: "∉",
    contains: "~",
  }
  return operators[operator] ?? operator
}

/** Shows active query filters with remove buttons */
export function ActiveQueryFilters({ q, slug }: ActiveQueryFiltersProps) {
  const navigate = useNavigate()

  if (!q) return null

  const conditions = q.split(",")

  function handleRemove(index: number) {
    const remaining = conditions.filter((_, i) => i !== index)
    const newQ = remaining.length > 0 ? remaining.join(",") : undefined
    void navigate({
      to: "/s/$slug",
      params: { slug },
      search: (prev) => ({ ...prev, q: newQ }),
    })
  }

  return (
    <Group gap="xs" mb="md">
      {conditions.map((condition, index) => {
        const { field, operator, value } = parseCondition(condition)
        return (
          <Badge
            key={condition}
            variant="light"
            color="gray"
            rightSection={
              <ActionIcon
                size="xs"
                variant="transparent"
                onClick={() => {
                  handleRemove(index)
                }}
              >
                <IconX size={12} />
              </ActionIcon>
            }
          >
            {field} {formatOperator(operator)} {value}
          </Badge>
        )
      })}
    </Group>
  )
}
