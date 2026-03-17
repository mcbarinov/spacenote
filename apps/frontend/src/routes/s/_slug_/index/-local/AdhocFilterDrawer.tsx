import { Button, Drawer, Group, Stack } from "@mantine/core"
import { IconPlus } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import type { Space } from "@/types"
import { useState, useMemo } from "react"
import { SYSTEM_FIELDS } from "@/utils/filters"
import { type Condition, generateConditionId, parseQueryString, buildQueryString } from "./filterUtils"
import { AdhocConditionRow } from "./AdhocConditionRow"

type ViewMode = "default" | "template" | "json"

interface AdhocFilterDrawerProps {
  opened: boolean
  onClose: () => void
  space: Space
  q: string | undefined
  filter: string | undefined
  view: ViewMode | undefined
}

/** Drawer with query builder UI for adhoc filtering */
export function AdhocFilterDrawer({ opened, onClose, space, q, filter, view }: AdhocFilterDrawerProps) {
  const navigate = useNavigate()
  const [conditions, setConditions] = useState<Condition[]>(() => parseQueryString(q))

  // Build field options from system fields + custom fields (excluding image type)
  const fieldOptions = useMemo(
    () => [
      ...SYSTEM_FIELDS.map((f) => ({ value: f.name, label: f.label })),
      ...space.fields.filter((f) => f.type !== "image").map((f) => ({ value: `note.fields.${f.name}`, label: f.name })),
    ],
    [space.fields]
  )

  function addCondition() {
    setConditions([...conditions, { id: generateConditionId(), field: "", operator: "eq", value: "" }])
  }

  function updateCondition(id: string, condition: Condition) {
    setConditions(conditions.map((c) => (c.id === id ? condition : c)))
  }

  function removeCondition(id: string) {
    setConditions(conditions.filter((c) => c.id !== id))
  }

  function handleClear() {
    setConditions([])
  }

  function handleApply() {
    const newQ = buildQueryString(conditions)
    void navigate({
      to: "/s/$slug",
      params: { slug: space.slug },
      search: { filter, view, q: newQ },
    })
    onClose()
  }

  return (
    <Drawer opened={opened} onClose={onClose} title="Adhoc Filter" position="right" size="md">
      <Stack gap="sm">
        {conditions.map((condition) => (
          <AdhocConditionRow
            key={condition.id}
            condition={condition}
            space={space}
            onChange={(c) => {
              updateCondition(condition.id, c)
            }}
            onRemove={() => {
              removeCondition(condition.id)
            }}
            fieldOptions={fieldOptions}
          />
        ))}

        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addCondition}>
          Add condition
        </Button>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClear}>
            Clear
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </Group>
      </Stack>
    </Drawer>
  )
}
