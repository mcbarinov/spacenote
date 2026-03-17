import { ActionIcon, Group, NumberInput, Select, TagsInput, TextInput } from "@mantine/core"
import { DateTimePicker, type DateValue } from "@mantine/dates"
import { IconX } from "@tabler/icons-react"
import type { SelectFieldOptions, Space } from "@/types"
import { OPERATORS_BY_TYPE, OPERATOR_LABELS, getFieldDefinition } from "@/utils/filters"
import type { Condition } from "./filterUtils"

interface AdhocConditionRowProps {
  condition: Condition
  space: Space
  onChange: (condition: Condition) => void
  onRemove: () => void
  fieldOptions: { value: string; label: string }[]
}

/** Single condition row with field, operator, and value inputs */
export function AdhocConditionRow({ condition, space, onChange, onRemove, fieldOptions }: AdhocConditionRowProps) {
  const fieldDef = getFieldDefinition(condition.field, space.fields)
  const operators = fieldDef ? OPERATORS_BY_TYPE[fieldDef.type] : []
  const operatorOptions = operators.map((op) => ({ value: op, label: OPERATOR_LABELS[op] || op }))

  /** Updates field and resets operator/value if field type changes */
  function handleFieldChange(field: string | null) {
    if (!field) return
    const newDef = getFieldDefinition(field, space.fields)
    const oldDef = getFieldDefinition(condition.field, space.fields)

    if (newDef?.type !== oldDef?.type) {
      const defaultOperator = newDef ? OPERATORS_BY_TYPE[newDef.type][0] : "eq"
      onChange({ ...condition, field, operator: defaultOperator, value: "" })
    } else {
      onChange({ ...condition, field })
    }
  }

  /** Renders value input based on field type */
  function renderValueInput() {
    if (!fieldDef) {
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

    switch (fieldDef.type) {
      case "select": {
        const options = (fieldDef.options as SelectFieldOptions).values
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
