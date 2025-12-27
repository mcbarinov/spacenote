import { ActionIcon, Button, Drawer, Group, NumberInput, Select, Stack, TagsInput, TextInput } from "@mantine/core"
import { DateTimePicker, type DateValue } from "@mantine/dates"
import { IconPlus, IconX } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import type { FieldType, SelectFieldOptions, Space, SpaceField } from "@spacenote/common/types"
import { useState, useMemo } from "react"
import { type Condition, generateId, parseQueryString, buildQueryString } from "./filterUtils"

type ViewMode = "default" | "template" | "json"

interface AdhocFilterDrawerProps {
  opened: boolean
  onClose: () => void
  space: Space
  q: string | undefined
  filter: string | undefined
  view: ViewMode | undefined
}

/** Operators available for each field type */
const FIELD_TYPE_OPERATORS: Record<FieldType, string[]> = {
  string: ["eq", "ne", "contains", "startswith", "endswith"],
  boolean: ["eq", "ne"],
  numeric: ["eq", "ne", "gt", "gte", "lt", "lte"],
  datetime: ["eq", "ne", "gt", "gte", "lt", "lte"],
  select: ["eq", "ne", "in", "nin"],
  tags: ["eq", "ne", "in", "nin", "all"],
  user: ["eq", "ne"],
  image: [],
}

/** Display labels for operators */
const OPERATOR_LABELS: Record<string, string> = {
  eq: "equals",
  ne: "not equals",
  contains: "contains",
  startswith: "starts with",
  endswith: "ends with",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  in: "in",
  nin: "not in",
  all: "has all",
}

/** System fields available for filtering */
const SYSTEM_FIELDS: { value: string; label: string; type: FieldType }[] = [
  { value: "note.number", label: "Number", type: "numeric" },
  { value: "note.author", label: "Author", type: "user" },
  { value: "note.created_at", label: "Created", type: "datetime" },
  { value: "note.edited_at", label: "Edited", type: "datetime" },
  { value: "note.activity_at", label: "Activity", type: "datetime" },
]

/** Gets field type for a given field path */
function getFieldType(fieldPath: string, space: Space): FieldType | null {
  const systemField = SYSTEM_FIELDS.find((f) => f.value === fieldPath)
  if (systemField) return systemField.type

  if (fieldPath.startsWith("note.fields.")) {
    const fieldName = fieldPath.slice("note.fields.".length)
    const spaceField = space.fields.find((f) => f.name === fieldName)
    return spaceField?.type ?? null
  }

  return null
}

/** Gets SpaceField definition for custom fields */
function getSpaceField(fieldPath: string, space: Space): SpaceField | null {
  if (!fieldPath.startsWith("note.fields.")) return null
  const fieldName = fieldPath.slice("note.fields.".length)
  return space.fields.find((f) => f.name === fieldName) ?? null
}

interface ConditionRowProps {
  condition: Condition
  space: Space
  onChange: (condition: Condition) => void
  onRemove: () => void
  fieldOptions: { value: string; label: string }[]
}

/** Single condition row with field, operator, and value inputs */
function ConditionRow({ condition, space, onChange, onRemove, fieldOptions }: ConditionRowProps) {
  const fieldType = getFieldType(condition.field, space)
  const operators = fieldType ? FIELD_TYPE_OPERATORS[fieldType] : []
  const operatorOptions = operators.map((op) => ({ value: op, label: OPERATOR_LABELS[op] || op }))

  /** Updates field and resets operator/value if field type changes */
  function handleFieldChange(field: string | null) {
    if (!field) return
    const newType = getFieldType(field, space)
    const oldType = getFieldType(condition.field, space)

    if (newType !== oldType) {
      const defaultOperator = newType ? FIELD_TYPE_OPERATORS[newType][0] : "eq"
      onChange({ ...condition, field, operator: defaultOperator, value: "" })
    } else {
      onChange({ ...condition, field })
    }
  }

  /** Renders value input based on field type */
  function renderValueInput() {
    if (!fieldType) {
      return (
        <TextInput
          placeholder="Value"
          value={condition.value}
          onChange={(e) => {
            onChange({ ...condition, value: e.currentTarget.value })
          }}
          style={{ flex: 1 }}
        />
      )
    }

    const spaceField = getSpaceField(condition.field, space)

    switch (fieldType) {
      case "select": {
        const options = spaceField ? (spaceField.options as SelectFieldOptions).values : []
        if (condition.operator === "in" || condition.operator === "nin") {
          return (
            <TagsInput
              placeholder="Values"
              value={condition.value ? condition.value.split("|") : []}
              onChange={(values) => {
                onChange({ ...condition, value: values.join("|") })
              }}
              data={options}
              style={{ flex: 1 }}
            />
          )
        }
        return (
          <Select
            placeholder="Value"
            data={options}
            value={condition.value || null}
            onChange={(v) => {
              onChange({ ...condition, value: v ?? "" })
            }}
            clearable
            style={{ flex: 1 }}
          />
        )
      }

      case "user": {
        const members = ["$me", ...space.members]
        return (
          <Select
            placeholder="Value"
            data={members}
            value={condition.value || null}
            onChange={(v) => {
              onChange({ ...condition, value: v ?? "" })
            }}
            clearable
            searchable
            style={{ flex: 1 }}
          />
        )
      }

      case "tags": {
        if (condition.operator === "in" || condition.operator === "nin" || condition.operator === "all") {
          return (
            <TagsInput
              placeholder="Tags"
              value={condition.value ? condition.value.split("|") : []}
              onChange={(values) => {
                onChange({ ...condition, value: values.join("|") })
              }}
              style={{ flex: 1 }}
            />
          )
        }
        return (
          <TextInput
            placeholder="Tag"
            value={condition.value}
            onChange={(e) => {
              onChange({ ...condition, value: e.currentTarget.value })
            }}
            style={{ flex: 1 }}
          />
        )
      }

      case "boolean":
        return (
          <Select
            placeholder="Value"
            data={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]}
            value={condition.value || null}
            onChange={(v) => {
              onChange({ ...condition, value: v ?? "" })
            }}
            style={{ flex: 1 }}
          />
        )

      case "numeric":
        return (
          <NumberInput
            placeholder="Value"
            value={condition.value ? Number(condition.value) : ""}
            onChange={(v) => {
              onChange({ ...condition, value: v === "" ? "" : String(v) })
            }}
            style={{ flex: 1 }}
          />
        )

      case "datetime": {
        function handleDateChange(date: DateValue) {
          if (date instanceof Date) {
            onChange({ ...condition, value: date.toISOString() })
          } else {
            onChange({ ...condition, value: "" })
          }
        }
        return (
          <DateTimePicker
            placeholder="Value"
            value={condition.value ? new Date(condition.value) : null}
            onChange={handleDateChange}
            clearable
            style={{ flex: 1 }}
          />
        )
      }

      default:
        return (
          <TextInput
            placeholder="Value"
            value={condition.value}
            onChange={(e) => {
              onChange({ ...condition, value: e.currentTarget.value })
            }}
            style={{ flex: 1 }}
          />
        )
    }
  }

  return (
    <Group gap="xs" wrap="nowrap">
      <Select
        placeholder="Field"
        data={fieldOptions}
        value={condition.field || null}
        onChange={handleFieldChange}
        searchable
        style={{ width: 140 }}
      />
      <Select
        placeholder="Operator"
        data={operatorOptions}
        value={condition.operator || null}
        onChange={(v) => {
          onChange({ ...condition, operator: v ?? "eq" })
        }}
        disabled={!condition.field}
        style={{ width: 120 }}
      />
      {renderValueInput()}
      <ActionIcon variant="subtle" color="gray" onClick={onRemove}>
        <IconX size={16} />
      </ActionIcon>
    </Group>
  )
}

/** Drawer with query builder UI for adhoc filtering */
export function AdhocFilterDrawer({ opened, onClose, space, q, filter, view }: AdhocFilterDrawerProps) {
  const navigate = useNavigate()
  const [conditions, setConditions] = useState<Condition[]>(() => parseQueryString(q))

  // Build field options from system fields + custom fields (excluding image type)
  const fieldOptions = useMemo(
    () => [
      ...SYSTEM_FIELDS.map((f) => ({ value: f.value, label: f.label })),
      ...space.fields.filter((f) => f.type !== "image").map((f) => ({ value: `note.fields.${f.name}`, label: f.name })),
    ],
    [space.fields]
  )

  function addCondition() {
    setConditions([...conditions, { id: generateId(), field: "", operator: "eq", value: "" }])
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
          <ConditionRow
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
