import { ActionIcon, Badge, Group } from "@mantine/core"
import { IconX } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { parseCondition, getFieldDisplayName, formatOperator } from "./filterUtils"

interface ActiveQueryFiltersProps {
  q: string | undefined
  slug: string
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
        const parsed = parseCondition(condition)
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
            {getFieldDisplayName(parsed.field)} {formatOperator(parsed.operator)} {parsed.value}
          </Badge>
        )
      })}
    </Group>
  )
}
